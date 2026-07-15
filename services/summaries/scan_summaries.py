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
    if "fail" in statuses:
        return "fail"
    if "pass" in statuses:
        return "pass"
    return "info"


def ensure_collections(db, target):
    for name in (CHART_TARGETS[target], ORG_TARGETS[target]):
        if not db.has_collection(name):
            db.create_collection(name)


DATE_PREFIX = r"^\d{4}-\d{2}-\d{2}"


def profile_scans(db):
    """Report raw-scan form; return the earliest day-bucketable scan date.

    Scans whose timestamp isn't a "YYYY-MM-DD..." string match no day range and
    are skipped by reconstruction. Count and sample them so a systematic format
    change is visible rather than silently shrinking the rebuilt history.
    """
    earliest = next(
        db.aql.execute(
            """
            FOR d IN dns
                FILTER REGEX_TEST(d.timestamp, @pattern)
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
                    FILTER !REGEX_TEST(d.timestamp, @pattern)
                    COLLECT WITH COUNT INTO total
                    RETURN total
                """,
                bind_vars={"@collection": collection, "pattern": DATE_PREFIX},
            ),
            0,
        )
        if skipped:
            samples = list(
                db.aql.execute(
                    """
                    FOR d IN @@collection
                        FILTER !REGEX_TEST(d.timestamp, @pattern)
                        LIMIT 3
                        RETURN d.timestamp
                    """,
                    bind_vars={"@collection": collection, "pattern": DATE_PREFIX},
                )
            )
            logging.warning(
                f"{collection}: {skipped} scans have non-bucketable timestamps and will be "
                f"skipped. Samples: {samples}"
            )
        else:
            logging.info(f"{collection}: all scan timestamps are day-bucketable.")

    missing_dmarc = next(
        db.aql.execute(
            "FOR d IN dns FILTER d.dmarc.status == null COLLECT WITH COUNT INTO total RETURN total"
        ),
        0,
    )
    if missing_dmarc:
        logging.warning(
            f"dns: {missing_dmarc} scans have no dmarc.status; they reconstruct as 'info' "
            "and drop out of pass/fail totals."
        )

    logging.info(f"earliest day-bucketable dns scan: {earliest!r}")
    return datetime.strptime(earliest[:10], "%Y-%m-%d").date()


def reconstruct_day(db, day):
    """Return {domain_name: entry} for domains scanned on `day` (latest scan wins)."""
    start = day.isoformat()
    end = (day + timedelta(days=1)).isoformat()

    dns_cursor = db.aql.execute(
        """
        FOR d IN dns
            FILTER d.timestamp >= @start AND d.timestamp < @end
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

    updates = {}
    for row in dns_cursor:
        tags = (
            (row.get("dmarcTags") or [])
            + (row.get("spfTags") or [])
            + (row.get("dkimTags") or [])
        )
        updates[row["domain"]] = {
            "rcode": row.get("rcode"),
            "phase": row.get("phase"),
            "status": {
                "dmarc": row.get("dmarc") or "info",
                "spf": row.get("spf") or "info",
                "dkim": row.get("dkim") or "info",
                "https": "info",
                "hsts": "info",
                "ssl": "info",
            },
            "dns_tags": tags,
            "web_tags": [],
        }

    web_cursor = db.aql.execute(
        """
        WITH webScan
        FOR w IN web
            FILTER w.timestamp >= @start AND w.timestamp < @end
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
        entry = updates.get(row["domain"])
        if entry is None:
            continue
        scans = row["scans"]
        entry["status"]["https"] = worst_status([s["https"] for s in scans])
        entry["status"]["hsts"] = worst_status([s["hsts"] for s in scans])
        entry["status"]["ssl"] = worst_status([s["ssl"] for s in scans])
        web_tags = []
        for s in scans:
            web_tags.extend(s.get("tlsTags") or [])
            web_tags.extend(s.get("connTags") or [])
        entry["web_tags"] = web_tags

    return updates


def build_precomputed(db):
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
    return {
        "pass": metric["pass"],
        "fail": metric["fail"],
        "total": metric["pass"] + metric["fail"],
    }


def build_org_doc(org_id, day_iso, acc):
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


def upsert_chart(col, day_iso, scope, charts, phases):
    doc = {**charts, "dmarc_phase": {**phases, "total": sum(phases.values())}}
    existing = col.find({"date": day_iso, "scope": scope})
    if existing.empty():
        col.insert({"date": day_iso, "scope": scope, **doc})
    else:
        col.update_match({"date": day_iso, "scope": scope}, doc)


def upsert_org(col, day_iso, org_id, acc):
    doc = build_org_doc(org_id, day_iso, acc)
    existing = col.find({"organization": org_id, "date": day_iso})
    if existing.empty():
        col.insert(doc)
    else:
        existing_doc = existing.next()
        col.update({"_key": existing_doc["_key"], **doc})


def write_day(
    chart_col,
    org_col,
    day,
    state,
    domain_by_name,
    scopes_by_domain_id,
    orgs_by_domain_name,
):
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

    for scope in SCOPES:
        upsert_chart(chart_col, day_iso, scope, chart_summaries[scope], dmarc_phases[scope])
    for org_id, acc in org_accs.items():
        upsert_org(org_col, day_iso, org_id, acc)


def run_backfill(
    host=DB_URL,
    name=DB_NAME,
    user=DB_USER,
    password=DB_PASS,
    target="shadow",
    start=None,
    end=None,
):
    client = ArangoClient(hosts=host)
    db = client.db(name, username=user, password=password)

    ensure_collections(db, target)

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
        state.update(reconstruct_day(db, day))
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
