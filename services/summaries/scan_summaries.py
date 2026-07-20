import os
import sys
import logging
import argparse
from datetime import date, datetime, timedelta

from arango import ArangoClient
from dotenv import load_dotenv

from summaries import CHARTS, SCOPES, ignore_domain, domain_scopes

load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
DB_URL = os.getenv("DB_URL")

CHART_TARGETS = {"shadow": "chartSummaries_rebuild", "prod": "chartSummaries"}
ORG_TARGETS = {"shadow": "organizationSummaries_rebuild", "prod": "organizationSummaries"}

logging.basicConfig(stream=sys.stdout, level=logging.INFO)


def worst_status(statuses):
    """Return the worst status in the list: fail, else pass, else info."""
    if "fail" in statuses:
        return "fail"
    if "pass" in statuses:
        return "pass"
    return "info"


def ensure_collections(db, target):
    for name in (CHART_TARGETS[target], ORG_TARGETS[target]):
        if not db.has_collection(name):
            db.create_collection(name)


def warn_missing_source_indexes(db):
    """Warn if dns/web are missing the timestamp index the daily reads rely on."""
    for name in ("dns", "web"):
        has_index = any(
            ix["type"] == "persistent" and ix["fields"] == ["timestamp"]
            for ix in db.collection(name).indexes()
        )
        if not has_index:
            logging.warning(
                f"{name} has no persistent 'timestamp' index; each day's read will full-scan "
                f"{name}. Create it once with: db.{name}.ensureIndex("
                "{type:'persistent', fields:['timestamp'], inBackground:true})"
            )


DATE_PREFIX = r"^\d{4}-\d{2}-\d{2}"


def profile_scans(db):
    """Find the earliest day worth backfilling and flag scans we'll skip."""
    earliest = next(
        db.aql.execute(
            """
            FOR d IN dns
                FILTER d.domain != null AND REGEX_TEST(d.timestamp, @pattern)
                SORT d.timestamp ASC
                LIMIT 1
                RETURN d.timestamp
            """,
            bind_vars={"pattern": DATE_PREFIX},
        ),
        None,
    )
    if earliest is None:
        return None

    for collection in ("dns", "web"):
        skipped = next(
            db.aql.execute(
                """
                FOR d IN @@collection
                    FILTER d.domain == null OR NOT REGEX_TEST(d.timestamp, @pattern)
                    COLLECT WITH COUNT INTO total
                    RETURN total
                """,
                bind_vars={"@collection": collection, "pattern": DATE_PREFIX},
            ),
            0,
        )
        if skipped:
            logging.warning(f"{collection}: {skipped} scans lack a usable domain/timestamp; skipping them.")

    logging.info(f"Earliest usable dns scan: {earliest!r}")
    return datetime.strptime(earliest[:10], "%Y-%m-%d").date()


def new_state_entry():
    """Blank per-domain state: every field unknown ('info') until a scan fills it in."""
    return {
        "rcode": None,
        "phase": None,
        "status": {
            "dmarc": "info",
            "spf": "info",
            "dkim": "info",
            "https": "info",
            "hsts": "info",
            "ssl": "info",
        },
        "dns_tags": [],
        "web_tags": [],
    }


def reconstruct_day(db, day, state):
    """Generate a day's state from its scans. Uses the existing state to carry forward any domains that had no scans that day."""
    start = day.isoformat()
    end = (day + timedelta(days=1)).isoformat()

    dns_cursor = db.aql.execute(
        """
        FOR d IN dns
            FILTER d.domain != null AND d.timestamp >= @start AND d.timestamp < @end
            COLLECT domain = d.domain INTO scans = d
            LET latest = FIRST(FOR s IN scans SORT s.timestamp DESC LIMIT 1 RETURN s)
            RETURN {
                domain: domain,
                rcode: latest.rcode,
                dmarc: latest.dmarc.status,
                spf: latest.spf.status,
                dkim: latest.dkim.status,
                phase: latest.dmarc.phase,
                dmarcTags: latest.dmarc.negativeTags,
                spfTags: latest.spf.negativeTags,
                dkimTags: latest.dkim.negativeTags
            }
        """,
        bind_vars={"start": start, "end": end},
    )

    for row in dns_cursor:
        tags = (
            (row.get("dmarcTags") or [])
            + (row.get("spfTags") or [])
            + (row.get("dkimTags") or [])
        )
        entry = state.setdefault(row["domain"], new_state_entry())
        entry["rcode"] = row.get("rcode")
        entry["phase"] = row.get("phase")
        entry["status"]["dmarc"] = row.get("dmarc") or "info"
        entry["status"]["spf"] = row.get("spf") or "info"
        entry["status"]["dkim"] = row.get("dkim") or "info"
        entry["dns_tags"] = tags

    web_cursor = db.aql.execute(
        """
        FOR w IN web
            FILTER w.domain != null AND w.timestamp >= @start AND w.timestamp < @end
            COLLECT domain = w.domain INTO webs = w
            LET latest = FIRST(FOR x IN webs SORT x.timestamp DESC LIMIT 1 RETURN x)
            LET scans = (
                FOR s IN 1..1 ANY latest._id webToWebScans
                    FILTER s.status == "complete"
                    RETURN {
                        https: s.results.connectionResults.httpsStatus,
                        hsts: s.results.connectionResults.hstsStatus,
                        ssl: s.results.tlsResult.sslStatus,
                        tlsTags: s.results.tlsResult.negativeTags,
                        connTags: s.results.connectionResults.negativeTags
                    }
            )
            RETURN { domain: domain, scans: scans }
        """,
        bind_vars={"start": start, "end": end},
    )

    for row in web_cursor:
        scans = row["scans"]
        if not scans:
            continue
        entry = state.setdefault(row["domain"], new_state_entry())
        entry["status"]["https"] = worst_status([s["https"] for s in scans])
        entry["status"]["hsts"] = worst_status([s["hsts"] for s in scans])
        entry["status"]["ssl"] = worst_status([s["ssl"] for s in scans])
        web_tags = []
        for s in scans:
            web_tags.extend(s.get("tlsTags") or [])
            web_tags.extend(s.get("connTags") or [])
        entry["web_tags"] = web_tags


def build_precomputed(db):
    """Load the domain, scope, and org lookups reused for every day."""
    domain_by_name = {}
    scopes_by_domain_id = {}
    cursor = db.aql.execute(
        """
        FOR d IN domains
            RETURN { _id: d._id, domain: d.domain, archived: d.archived, blocked: d.blocked }
        """
    )
    for dom in cursor:
        domain_by_name[dom["domain"]] = dom
        scopes_by_domain_id[dom["_id"]] = domain_scopes(dom, db)

    id_to_name = {dom["_id"]: name for name, dom in domain_by_name.items()}
    orgs_by_domain_name = {}
    for claim in db.collection("claims"):
        if claim.get("assetState") != "approved":
            continue
        name = id_to_name.get(claim["_to"])
        if name is None:
            continue
        orgs_by_domain_name.setdefault(name, []).append(claim["_from"])

    return domain_by_name, scopes_by_domain_id, orgs_by_domain_name


def new_org_acc():
    return {
        "https": {"pass": 0, "fail": 0},
        "dmarc": {"pass": 0, "fail": 0},
        "web_connections": {"pass": 0, "fail": 0},
        "ssl": {"pass": 0, "fail": 0},
        "spf": {"pass": 0, "fail": 0},
        "dkim": {"pass": 0, "fail": 0},
        "web": {"pass": 0, "fail": 0},
        "mail": {"pass": 0, "fail": 0},
        "dmarc_phase": {"assess": 0, "deploy": 0, "enforce": 0, "maintain": 0},
        "negative_tags": {},
    }


def accumulate_chart(chart_summaries, dmarc_phases, scopes, status, phase):
    """Add one domain's result to the chart summaries for each of its scopes."""
    for chart_type, scan_types in CHARTS.items():
        category_status = [status.get(scan_type) for scan_type in scan_types]
        if "fail" in category_status:
            result = "fail"
        elif (
            chart_type == "mail"
            and status.get("dkim") == "info"
            and "pass" in category_status
        ) or "info" not in category_status:
            result = "pass"
        else:
            continue
        for scope in scopes:
            chart = chart_summaries[scope][chart_type]
            chart[result] += 1
            chart["total"] += 1

    if phase is None or status.get("dmarc") == "info":
        return
    if phase in ("assess", "deploy", "enforce", "maintain"):
        for scope in scopes:
            dmarc_phases[scope][phase] += 1


def accumulate_org(acc, status, phase, tags):
    """Add one domain's result to its organization's running counters."""
    https = status.get("https")
    dmarc = status.get("dmarc")
    hsts = status.get("hsts")
    ssl = status.get("ssl")
    spf = status.get("spf")
    dkim = status.get("dkim")

    if https == "pass":
        acc["https"]["pass"] += 1
    elif https == "fail":
        acc["https"]["fail"] += 1
    if dmarc == "pass":
        acc["dmarc"]["pass"] += 1
    elif dmarc == "fail":
        acc["dmarc"]["fail"] += 1

    if https == "pass" and hsts == "pass":
        acc["web_connections"]["pass"] += 1
    elif https == "fail" or hsts == "fail":
        acc["web_connections"]["fail"] += 1
    if ssl == "pass":
        acc["ssl"]["pass"] += 1
    elif ssl == "fail":
        acc["ssl"]["fail"] += 1
    if spf == "pass":
        acc["spf"]["pass"] += 1
    elif spf == "fail":
        acc["spf"]["fail"] += 1
    if dkim == "pass":
        acc["dkim"]["pass"] += 1
    elif dkim == "fail":
        acc["dkim"]["fail"] += 1

    if ssl == "pass" and https == "pass":
        acc["web"]["pass"] += 1
    elif ssl == "fail" or https == "fail":
        acc["web"]["fail"] += 1
    if dkim == "info":
        if dmarc == "pass" and spf == "pass":
            acc["mail"]["pass"] += 1
        elif dmarc == "fail" or spf == "fail":
            acc["mail"]["fail"] += 1
    else:
        if dmarc == "pass" and spf == "pass" and dkim == "pass":
            acc["mail"]["pass"] += 1
        elif dmarc == "fail" or spf == "fail" or dkim == "fail":
            acc["mail"]["fail"] += 1

    if phase is None or dmarc == "info":
        return
    if phase in ("assess", "deploy", "enforce", "maintain"):
        acc["dmarc_phase"][phase] += 1
    for tag in tags:
        acc["negative_tags"][tag] = acc["negative_tags"].get(tag, 0) + 1


def to_category(metric):
    """Turn a pass/fail pair into a pass/fail/total block."""
    return {
        "pass": metric["pass"],
        "fail": metric["fail"],
        "total": metric["pass"] + metric["fail"],
    }


def build_org_doc(org_id, day_iso, acc):
    """Shape one org's counters into a summary document."""
    phases = acc["dmarc_phase"]
    return {
        "organization": org_id,
        "date": day_iso,
        "dmarc": to_category(acc["dmarc"]),
        "web": to_category(acc["web"]),
        "mail": to_category(acc["mail"]),
        "dmarc_phase": {**phases, "total": sum(phases.values())},
        "https": to_category(acc["https"]),
        "ssl": to_category(acc["ssl"]),
        "spf": to_category(acc["spf"]),
        "dkim": to_category(acc["dkim"]),
        "web_connections": to_category(acc["web_connections"]),
        "negative_tags": acc["negative_tags"],
    }


def write_day(
    chart_col,
    org_col,
    day,
    state,
    domain_by_name,
    scopes_by_domain_id,
    orgs_by_domain_name,
):
    """Roll the day's state into chart + org summaries and save them."""
    day_iso = day.isoformat()

    chart_summaries = {
        scope: {
            chart_type: {"scan_types": scan_types, "pass": 0, "fail": 0, "total": 0}
            for chart_type, scan_types in CHARTS.items()
        }
        for scope in SCOPES
    }
    dmarc_phases = {
        scope: {"assess": 0, "deploy": 0, "enforce": 0, "maintain": 0}
        for scope in SCOPES
    }
    org_accs = {}

    for name, entry in state.items():
        domain = domain_by_name.get(name)
        if domain is None:
            continue
        if ignore_domain(
            {
                "archived": domain.get("archived"),
                "blocked": domain.get("blocked"),
                "rcode": entry["rcode"],
            }
        ):
            continue

        status = entry["status"]
        phase = entry["phase"]

        scopes = scopes_by_domain_id.get(domain["_id"], set())
        if scopes:
            accumulate_chart(chart_summaries, dmarc_phases, scopes, status, phase)

        tags = entry["dns_tags"] + entry["web_tags"]
        for org_id in orgs_by_domain_name.get(name, []):
            acc = org_accs.get(org_id)
            if acc is None:
                acc = new_org_acc()
                org_accs[org_id] = acc
            accumulate_org(acc, status, phase, tags)

    chart_docs = []
    for scope in SCOPES:
        phases = dmarc_phases[scope]
        chart_docs.append({
            "_key": f"{day_iso}:{scope}",
            "date": day_iso,
            "scope": scope,
            **chart_summaries[scope],
            "dmarc_phase": {**phases, "total": sum(phases.values())},
        })
    org_docs = []
    for org_id, acc in org_accs.items():
        doc = build_org_doc(org_id, day_iso, acc)
        doc["_key"] = f"{day_iso}:{org_id.split('/')[-1]}"
        org_docs.append(doc)

    chart_col.insert_many(chart_docs, overwrite_mode="replace")
    if org_docs:
        org_col.insert_many(org_docs, overwrite_mode="replace")


def run_backfill(
    host=DB_URL,
    name=DB_NAME,
    user=DB_USER,
    password=DB_PASS,
    target="shadow",
    start=None,
    end=None,
):
    """Rebuild summaries day by day, from the first scan up to the end date."""
    client = ArangoClient(hosts=host)
    db = client.db(name, username=user, password=password)

    ensure_collections(db, target)
    warn_missing_source_indexes(db)

    earliest = profile_scans(db)
    if earliest is None:
        logging.info("No DNS scans found; nothing to backfill.")
        return

    write_start = datetime.strptime(start, "%Y-%m-%d").date() if start else earliest
    write_end = datetime.strptime(end, "%Y-%m-%d").date() if end else date.today()

    chart_col = db.collection(CHART_TARGETS[target])
    org_col = db.collection(ORG_TARGETS[target])
    domain_by_name, scopes_by_domain_id, orgs_by_domain_name = build_precomputed(db)

    logging.info(
        f"Backfilling {CHART_TARGETS[target]}/{ORG_TARGETS[target]} "
        f"from {write_start} to {write_end} (accumulating from {earliest})..."
    )

    state = {}
    day = earliest
    while day <= write_end:
        reconstruct_day(db, day, state)
        if day >= write_start:
            write_day(
                chart_col,
                org_col,
                day,
                state,
                domain_by_name,
                scopes_by_domain_id,
                orgs_by_domain_name,
            )
            logging.info(f"Wrote summaries for {day.isoformat()} ({len(state)} domains in state).")
        day += timedelta(days=1)

    logging.info("Backfill completed.")


def main():
    parser = argparse.ArgumentParser(description="Reconstruct chart/org summaries from raw scans.")
    parser.add_argument("--target", choices=["shadow", "prod"], default="shadow")
    parser.add_argument("--start", help="First day to write (YYYY-MM-DD). Defaults to earliest scan.")
    parser.add_argument("--end", help="Last day to write (YYYY-MM-DD). Defaults to today.")
    args = parser.parse_args()

    logging.info("Scan-based summary backfill started")
    run_backfill(target=args.target, start=args.start, end=args.end)
    logging.info("Scan-based summary backfill shutting down...")


if __name__ == "__main__":
    main()
