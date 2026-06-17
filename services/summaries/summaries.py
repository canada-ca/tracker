import os
import sys
import logging
from datetime import date, timedelta
from arango import ArangoClient
from dotenv import load_dotenv

load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
DB_URL = os.getenv("DB_URL")

CHARTS = {
    # tier 1
    "https": ["https"],
    "dmarc": ["dmarc"],
    # tier 2
    "web_connections": ["https", "hsts"],
    "ssl": ["ssl"],
    "spf": ["spf"],
    "dkim": ["dkim"],
    # tier 3
    "mail": ["dmarc", "spf", "dkim"],
    "web": ["https", "hsts", "ssl"],
}

SCOPES = ["all", "verified", "psd", "pgs"]

logging.basicConfig(stream=sys.stdout, level=logging.INFO)


def domain_scopes(domain, db):
    cursor = db.aql.execute(
        """
            FOR org, claim IN 1..1 INBOUND @domain_id claims
                FILTER claim.assetState == "approved"
                RETURN { verified: org.verified, policies: org.policies }
            """,
        bind_vars={"domain_id": domain["_id"]},
    )
    orgs = [org for org in cursor]
    if len(orgs) == 0:
        return set()

    scopes = {"all"}
    for org in orgs:
        if org.get("verified") is True:
            scopes.add("verified")
        policies = org.get("policies") or {}
        if policies.get("psd") is True:
            scopes.add("psd")
        if policies.get("pgs") is True:
            scopes.add("pgs")
    return scopes


def ignore_domain(domain):
    """Check if a domain should be ignored

    :param domain: domain to check
    :return: True if domain should be ignored, False otherwise
    """

    return (
        domain is None
        or domain.get("archived") is True
        or domain.get("blocked") is True
        or domain.get("rcode") == "NXDOMAIN"
    )


def get_domain_negative_findings(db, domain):
    cursor = db.aql.execute(
        """
            LET emailTags = (
                LET dnsScan = DOCUMENT(@latest_dns_scan)
                FILTER dnsScan != null
                RETURN FLATTEN([dnsScan.dmarc.negativeTags, dnsScan.dkim.negativeTags, dnsScan.spf.negativeTags])
            )[0]
            LET webTags = (
                LET web = DOCUMENT(@latest_web_scan)
                FILTER web != null
                FOR webScan, webScanE IN 1 OUTBOUND web webToWebScans
                    RETURN FLATTEN([webScan.results.tlsResult.negativeTags, webScan.results.connectionResults.negativeTags])
            )
            FOR tag IN FLATTEN([emailTags, webTags], 2)
                FILTER tag != null
                RETURN tag
        """,
        bind_vars={
            "latest_dns_scan": domain.get("latestDnsScan"),
            "latest_web_scan": domain.get("latestWebScan"),
        },
    )
    if cursor.empty():
        return []
    return [tag for tag in cursor]


def update_chart_summaries(host=DB_URL, name=DB_NAME, user=DB_USER, password=DB_PASS):
    logging.info(f"Updating chart summaries...")

    # Establish DB connection
    client = ArangoClient(hosts=host)
    db = client.db(name, username=user, password=password)
    chartSummariesCol = db.collection("chartSummaries")

    db.aql.execute(
        """
            FOR summary IN chartSummaries
                FILTER summary.scope == null
                UPDATE summary WITH { scope: "verified" } IN chartSummaries
        """
    )

    # Gather summaries from domain statuses, one accumulator per scope.
    chartSummaries = {}
    dmarc_phases = {}
    for scope in SCOPES:
        chartSummaries[scope] = {
            chart_type: {
                "scan_types": scan_types,
                "pass": 0,
                "fail": 0,
                "total": 0,
            }
            for chart_type, scan_types in CHARTS.items()
        }
        # DMARC phases: assess, deploy, enforce, maintain
        dmarc_phases[scope] = {
            "assess": 0,
            "deploy": 0,
            "enforce": 0,
            "maintain": 0,
        }

    for domain in db.collection("domains"):
        if ignore_domain(domain) is True:
            continue

        scopes = domain_scopes(domain, db)
        if len(scopes) == 0:
            continue

        # Update chart summaries
        for chart_type, scan_types in CHARTS.items():
            category_status = []
            for scan_type in scan_types:
                category_status.append(domain.get("status", {}).get(scan_type))
            if "fail" in category_status:
                result = "fail"
            elif (
                chart_type == "mail"
                and domain.get("status", {}).get("dkim") == "info"
                and "pass" in category_status
            ) or "info" not in category_status:
                result = "pass"
            else:
                continue
            for scope in scopes:
                chart = chartSummaries[scope][chart_type]
                chart[result] += 1
                chart["total"] += 1

        # Update DMARC phase summaries
        phase = domain.get("phase")
        if phase is None or domain.get("status", {}).get("dmarc") == "info":
            logging.info(
                f"No DMARC scan data available for domain \"{domain['domain']}\"."
            )
            continue

        if phase in ("assess", "deploy", "enforce", "maintain"):
            for scope in scopes:
                dmarc_phases[scope][phase] += 1

    # Write one document per date, scope
    today_iso = date.today().isoformat()
    for scope in SCOPES:
        dmarc_phase_summary = {
            **dmarc_phases[scope],
            "total": sum(dmarc_phases[scope].values()),
        }

        cursor = chartSummariesCol.find({"date": today_iso, "scope": scope})
        if cursor.empty():
            chartSummariesCol.insert(
                {
                    "date": today_iso,
                    "scope": scope,
                    **chartSummaries[scope],
                    "dmarc_phase": dmarc_phase_summary,
                }
            )
        else:
            logging.info(
                f'Chart summary for scope "{scope}" from today already present. Updating summary...'
            )
            chartSummariesCol.update_match(
                {"date": today_iso, "scope": scope},
                {
                    **chartSummaries[scope],
                    "dmarc_phase": dmarc_phase_summary,
                },
            )
    logging.info(f"Chart summary update completed.")


def update_org_summaries(host=DB_URL, name=DB_NAME, user=DB_USER, password=DB_PASS):
    logging.info(f"Updating organization summary values...")

    # Establish DB connection
    client = ArangoClient(hosts=host)
    db = client.db(name, username=user, password=password)
    org_summaries_col = db.collection("organizationSummaries")
    organizations_col = db.collection("organizations")

    today_iso = date.today().isoformat()

    for org in organizations_col:
        logging.info(f"Working on organization {org['orgDetails']['en']['name']}...")

        try:
            # One-time migration: inline `summaries` -> organizationSummaries doc
            if org.get("latestSummaryId") is None and org.get("summaries"):
                inline = org["summaries"]
                inserted = org_summaries_col.insert(
                    {"organization": org["_id"], **inline}
                )
                organizations_col.update(
                    {
                        "_key": org["_key"],
                        "latestSummaryId": inserted["_id"],
                        "summaries": None,
                    },
                    keep_none=False,
                )

            # tier 1
            https_fail = 0
            https_pass = 0
            dmarc_pass = 0
            dmarc_fail = 0

            # tier 2
            web_connections_fail = 0
            web_connections_pass = 0
            ssl_fail = 0
            ssl_pass = 0
            spf_fail = 0
            spf_pass = 0
            dkim_fail = 0
            dkim_pass = 0

            # tier 3
            web_fail = 0
            web_pass = 0
            mail_fail = 0
            mail_pass = 0

            # dmarc phase
            dmarc_phase_assess = 0
            dmarc_phase_deploy = 0
            dmarc_phase_enforce = 0
            dmarc_phase_maintain = 0

            negative_tags = {}

            claims_cursor = db.collection("claims").find({"_from": org["_id"]})
            claims = [claim for claim in claims_cursor]
            for claim in claims:
                domain = db.collection("domains").get({"_id": claim["_to"]})
                try:
                    domain_status = domain.get("status", {})
                    if (
                        ignore_domain(domain) is False
                        and claim.get("assetState") == "approved"
                    ):
                        # tier 1
                        # https
                        https_status = domain_status.get("https")
                        if https_status == "pass":
                            https_pass = https_pass + 1
                        elif https_status == "fail":
                            https_fail = https_fail + 1
                        # dmarc
                        dmarc_status = domain_status.get("dmarc")
                        if dmarc_status == "pass":
                            dmarc_pass = dmarc_pass + 1
                        elif dmarc_status == "fail":
                            dmarc_fail = dmarc_fail + 1

                        # tier 2
                        # web connections
                        hsts_status = domain_status.get("hsts")
                        if https_status == "pass" and hsts_status == "pass":
                            web_connections_pass = web_connections_pass + 1
                        elif https_status == "fail" or hsts_status == "fail":
                            web_connections_fail = web_connections_fail + 1
                        # ssl/tls
                        ssl_status = domain_status.get("ssl")
                        if ssl_status == "pass":
                            ssl_pass = ssl_pass + 1
                        elif ssl_status == "fail":
                            ssl_fail = ssl_fail + 1
                        # spf
                        spf_status = domain_status.get("spf")
                        if spf_status == "pass":
                            spf_pass = spf_pass + 1
                        elif spf_status == "fail":
                            spf_fail = spf_fail + 1
                        # dkim
                        dkim_status = domain_status.get("dkim")
                        if dkim_status == "pass":
                            dkim_pass = dkim_pass + 1
                        elif dkim_status == "fail":
                            dkim_fail = dkim_fail + 1

                        # tier 3
                        # web
                        if ssl_status == "pass" and https_status == "pass":
                            web_pass = web_pass + 1
                        elif ssl_status == "fail" or https_status == "fail":
                            web_fail = web_fail + 1
                        # mail
                        if dkim_status == "info":
                            if dmarc_status == "pass" and spf_status == "pass":
                                mail_pass = mail_pass + 1
                            elif dmarc_status == "fail" or spf_status == "fail":
                                mail_fail = mail_fail + 1
                        else:
                            if (
                                dmarc_status == "pass"
                                and spf_status == "pass"
                                and dkim_status == "pass"
                            ):
                                mail_pass = mail_pass + 1
                            elif (
                                dmarc_status == "fail"
                                or spf_status == "fail"
                                or dkim_status == "fail"
                            ):
                                mail_fail = mail_fail + 1

                        # dmarc phase
                        phase = domain.get("phase")
                        if phase is None or dmarc_status == "info":
                            logging.info(
                                f"No DMARC scan data available for domain \"{domain['domain']}\"."
                            )
                            continue

                        if phase == "assess":
                            dmarc_phase_assess = dmarc_phase_assess + 1
                        elif phase == "deploy":
                            dmarc_phase_deploy = dmarc_phase_deploy + 1
                        elif phase == "enforce":
                            dmarc_phase_enforce = dmarc_phase_enforce + 1
                        elif phase == "maintain":
                            dmarc_phase_maintain = dmarc_phase_maintain + 1

                        # Negative tags
                        domain_negative_tags = get_domain_negative_findings(
                            db, domain
                        )
                        for tag in domain_negative_tags:
                            if tag in negative_tags:
                                negative_tags[tag] += 1
                            else:
                                negative_tags[tag] = 1
                except Exception as e:
                    logging.error(f"Error processing domain {domain['_id']}: {e}")
                    continue

            dmarc_phase_total = (
                dmarc_phase_assess
                + dmarc_phase_deploy
                + dmarc_phase_enforce
                + dmarc_phase_maintain
            )

            summary_data = {
                "organization": org["_id"],
                "date": today_iso,
                "dmarc": {
                    "pass": dmarc_pass,
                    "fail": dmarc_fail,
                    "total": dmarc_pass + dmarc_fail,
                },
                "web": {
                    "pass": web_pass,
                    "fail": web_fail,
                    "total": web_pass + web_fail,
                    # Don't count non web-hosting domains
                },
                "mail": {
                    "pass": mail_pass,
                    "fail": mail_fail,
                    "total": mail_pass + mail_fail,
                },
                "dmarc_phase": {
                    "assess": dmarc_phase_assess,
                    "deploy": dmarc_phase_deploy,
                    "enforce": dmarc_phase_enforce,
                    "maintain": dmarc_phase_maintain,
                    "total": dmarc_phase_total,
                },
                "https": {
                    "pass": https_pass,
                    "fail": https_fail,
                    "total": https_pass + https_fail,
                    # Don't count non web-hosting domains
                },
                "ssl": {
                    "pass": ssl_pass,
                    "fail": ssl_fail,
                    "total": ssl_pass + ssl_fail,
                    # Don't count non web-hosting domains
                },
                "spf": {
                    "pass": spf_pass,
                    "fail": spf_fail,
                    "total": spf_pass + spf_fail,
                },
                "dkim": {
                    "pass": dkim_pass,
                    "fail": dkim_fail,
                    "total": dkim_pass + dkim_fail,
                },
                "web_connections": {
                    "pass": web_connections_pass,
                    "fail": web_connections_fail,
                    "total": web_connections_pass + web_connections_fail,
                    # Don't count non web-hosting domains
                },
                "negative_tags": negative_tags,
            }

            existing_today = org_summaries_col.find(
                {"organization": org["_id"], "date": today_iso}
            )
            if existing_today.empty():
                inserted = org_summaries_col.insert(summary_data)
                latest_summary_id = inserted["_id"]
            else:
                existing_doc = existing_today.next()
                org_summaries_col.update({"_key": existing_doc["_key"], **summary_data})
                latest_summary_id = existing_doc["_id"]

            organizations_col.update(
                {
                    "_key": org["_key"],
                    "latestSummaryId": latest_summary_id,
                    "summaries": None,
                },
                keep_none=False,
            )
        except Exception as e:
            logging.error(f"Error processing organization {org['_id']}: {e}")
            continue

    logging.info(f"Organization summary value update completed.")


if __name__ == "__main__":
    logging.info("Summary service started")
    update_chart_summaries()
    update_org_summaries()
    logging.info(f"Summary service shutting down...")
