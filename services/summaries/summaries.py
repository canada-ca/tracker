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

logging.basicConfig(stream=sys.stdout, level=logging.INFO)


def domain_has_verified_claim(domain, db):
    cursor = db.aql.execute(
        """
            FOR v, e IN 1..1 INBOUND @domain_id claims
                FILTER v.verified == true
                RETURN v
            """,
        bind_vars={"domain_id": domain["_id"]},
    )
    if cursor.empty():
        return False
    return True


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


def get_domain_negative_findings(db, domain_id):
    cursor = db.aql.execute(
        """
            LET emailTags = (
                FOR dnsScan, dnsE IN 1 OUTBOUND @domain_id domainsDNS
                    SORT dnsScan.timestamp DESC
                    LIMIT 1
                    RETURN FLATTEN([dnsScan.dmarc.negativeTags, dnsScan.dkim.negativeTags, dnsScan.spf.negativeTags])
            )[0]
            LET webTags = (
                FOR web, webE IN 1 OUTBOUND @domain_id domainsWeb
                    SORT web.timestamp DESC
                    LIMIT 1
                    FOR webScan, webScanE IN 1 OUTBOUND web webToWebScans
                        RETURN FLATTEN([webScan.results.tlsResult.negativeTags, webScan.results.connectionResults.negativeTags])
            )
            FOR tag IN FLATTEN([emailTags, webTags], 2)
                FILTER tag != null
                RETURN tag
        """,
        bind_vars={"domain_id": domain_id},
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

    # Gather summaries from domain statuses
    chartSummaries = {}
    for chart_type, scan_types in CHARTS.items():
        chartSummaries[chart_type] = {
            "scan_types": scan_types,
            "pass": 0,
            "fail": 0,
            "total": 0,
        }

    # DMARC phases:
    # 1. Assess
    assess_count = 0
    # 2. Deploy
    deploy_count = 0
    # 3. Enforce
    enforce_count = 0
    # 4. Maintain
    maintain_count = 0

    for domain in db.collection("domains"):
        if (
            ignore_domain(domain) is False
            and domain_has_verified_claim(domain, db) is True
        ):
            # Update chart summaries
            for chart_type in chartSummaries:
                chart = chartSummaries[chart_type]
                category_status = []
                for scan_type in chart["scan_types"]:
                    category_status.append(domain.get("status", {}).get(scan_type))
                if "fail" in category_status:
                    chart["fail"] += 1
                    chart["total"] += 1
                elif (
                    chart_type == "mail"
                    and domain.get("status", {}).get("dkim") == "info"
                    and "pass" in category_status
                ) or "info" not in category_status:
                    chart["pass"] += 1
                    chart["total"] += 1

            # Update DMARC phase summaries
            phase = domain.get("phase")
            if phase is None or domain.get("status", {}).get("dmarc") == "info":
                logging.info(
                    f"No DMARC scan data available for domain \"{domain['domain']}\"."
                )
                continue

            if phase == "assess":
                assess_count = assess_count + 1
            elif phase == "deploy":
                deploy_count = deploy_count + 1
            elif phase == "enforce":
                enforce_count = enforce_count + 1
            elif phase == "maintain":
                maintain_count = maintain_count + 1

    # Update DMARC phase summaries in DB
    dmarc_phase_summary = {
        "assess": assess_count,
        "deploy": deploy_count,
        "enforce": enforce_count,
        "maintain": maintain_count,
        "total": assess_count
        + deploy_count
        + enforce_count
        + maintain_count,
    }

    # Update chart summaries in DB
    todayISO = date.today().isoformat()
    cursor = chartSummariesCol.find({"date": todayISO})
    if cursor.empty():
        chartSummariesCol.insert(
            {
                "date": todayISO,
                **chartSummaries,
                "dmarc_phase": dmarc_phase_summary,
            }
        )
    else:
        logging.info("Chart summary from today already present. Updating summary...")
        chartSummariesCol.update_match(
            {"date": todayISO},
            {
                **chartSummaries,
                "dmarc_phase": dmarc_phase_summary,
            },
        )
    logging.info(f"Chart summary update completed.")


def update_org_summaries(host=DB_URL, name=DB_NAME, user=DB_USER, password=DB_PASS):
    logging.info(f"Updating organization summary values...")

    # Establish DB connection
    client = ArangoClient(hosts=host)
    db = client.db(name, username=user, password=password)

    for org in db.collection("organizations"):
        logging.info(f"Working on organization {org['orgDetails']['en']['name']}...")

        try:
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
                            db, domain["_id"]
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
                "date": date.today().isoformat(),
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

            current_summary = org.get("summaries", {})
            if current_summary.get("date", "") != date.today().isoformat():
                logging.info(f"Storing previous summary for org: {org['_key']}")
                db.collection("organizationSummaries").insert(
                    {"organization": org.get("_id"), **current_summary}
                )
            org.update({"summaries": summary_data})
            db.collection("organizations").update(org)
        except Exception as e:
            logging.error(f"Error processing organization {org['_id']}: {e}")
            continue

    logging.info(f"Organization summary value update completed.")


if __name__ == "__main__":
    logging.info("Summary service started")
    update_chart_summaries()
    update_org_summaries()
    logging.info(f"Summary service shutting down...")
