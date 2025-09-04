import os
import sys
import logging
import copy
from datetime import datetime, timedelta, timezone
from arango import ArangoClient
from notify.send_email_notifs import send_email_notifs

from config import DB_USER, DB_PASS, DB_NAME, DB_URL, START_HOUR, START_MINUTE, DRY_RUN_EMAIL_MODE, DRY_RUN_LOG_MODE

logging.basicConfig(stream=sys.stdout, level=logging.INFO)
logger = logging.getLogger(__name__)

if DRY_RUN_EMAIL_MODE and DRY_RUN_LOG_MODE:
    logger.error("Both Dry Run Email mode and Dry Run Log mode cannot be enabled at the same time. Please check your environment variables.")
    sys.exit(1)
elif DRY_RUN_EMAIL_MODE:
    logger.info(f"Dry Run Email mode is enabled - emails will only be sent to the tracker service account email")
elif DRY_RUN_LOG_MODE:
    logger.info(f"Dry Run Log mode is enabled - no emails will be sent")
else:
    logger.info(f"Dry Run modes are disabled - emails will be sent to org owners/admins")

missing_envs = []
if not DB_USER:
    missing_envs.append("DB_USER")
if not DB_PASS:
    missing_envs.append("DB_PASS")
if not DB_NAME:
    missing_envs.append("DB_NAME")
if not DB_URL:
    missing_envs.append("DB_URL")
if not START_HOUR and START_HOUR != 0:
    missing_envs.append("DETECT_DECAY_START_HOUR")
if not START_MINUTE and START_MINUTE != 0:
    missing_envs.append("DETECT_DECAY_START_MINUTE")
if missing_envs:
    logger.error(f"Missing required environment variables: {', '.join(missing_envs)}")
    sys.exit(1)

def ignore_domain(domain):
    return (
        domain is None
        or domain.get("archived") is True
        or domain.get("blocked") is True
        or domain.get("rcode") == "NXDOMAIN"
    )

# Returns a timestamp in ISO format for the given hour and minute
def get_timestamp(hr, min):
    return (datetime.now(timezone.utc) - timedelta(days=1)).replace(hour=hr, minute=min, second=0, microsecond=0).isoformat(timespec='microseconds')

# Returns all dns scans that ran in the past 24hrs + the last dns scan that ran before this time
def get_all_dns_scans(domain_id, db):
    one_day_ago = get_timestamp(START_HOUR, START_MINUTE)
    dns_scans = db.aql.execute(
        """
        WITH domains, dns
        FOR dnsV, dnsE IN 1 OUTBOUND @domain_id domainsDNS
            FILTER dnsV.timestamp > @one_day_ago
            RETURN dnsV
        """,
        bind_vars={"domain_id": domain_id, 
                   "one_day_ago": one_day_ago},
    )

    all_dns_scans = db.aql.execute(
        """
        WITH domains, dns
        FOR dnsScanV, dnsScanE IN 1 OUTBOUND @domain_id domainsDNS
            SORT dnsScanV.timestamp DESC
            LIMIT @num
            RETURN {
                "dmarc_status": dnsScanV.dmarc.status,
                "spf_status": dnsScanV.spf.status,
                "dkim_status": dnsScanV.dkim.status,
            }
        """,
        bind_vars={"domain_id": domain_id, 
                   "num": len(list(dns_scans)) + 1},
    )

    return all_dns_scans

# Returns all web scans that ran in the past 24hrs + the last web scan that ran before this time
def get_all_web_scans(domain_id, db):
    one_day_ago = get_timestamp(START_HOUR, START_MINUTE)
    web_scans = db.aql.execute(
        """
        WITH domains, web
        FOR webV, webE IN 1 OUTBOUND @domain_id domainsWeb
            FILTER webV.timestamp > @one_day_ago
            RETURN webV
        """,
        bind_vars={"domain_id": domain_id, 
                   "one_day_ago": one_day_ago},
    )
    #num_web_scans = len(list(web_scans))
    all_web_scans = db.aql.execute(
        """
        WITH domains, web, webScan
        FOR webV, webE IN 1 OUTBOUND @domain_id domainsWeb 
            SORT webV.timestamp DESC
            LET scans = (
                FOR webScanV, webScanE IN 1 OUTBOUND webV._id webToWebScans
                    FILTER webScanV.status == "complete"
                    RETURN {
                        "status": webScanV.status,
			            "https_status": webScanV.results.connectionResults.httpsStatus,
                        "hsts_status": webScanV.results.connectionResults.hstsStatus,
                        "certificate_status": webScanV.results.tlsResult.certificateStatus,
                        "protocol_status": webScanV.results.tlsResult.protocolStatus,
                        "cipher_status": webScanV.results.tlsResult.cipherStatus,
                        "curve_status": webScanV.results.tlsResult.curveStatus,
		            }
            )
            FILTER COUNT(scans) > 0 AND scans[*].status ALL == "complete"
            LIMIT @num
            RETURN {
                "web_id": webV._id,
                "scans": scans
            }
        """,
        bind_vars={"domain_id": domain_id, 
                   "num": len(list(web_scans)) + 1},
    )
    #print(num_web_scans)
    return all_web_scans

# Returns a single status given a list of multiple statuses
def get_status(statuses):
    if "fail" in statuses:
        return "fail"
    elif "pass" in statuses:
        return "pass"
    else:
        return "info"

# Used when a domain has multiple IPs
def finalize_web_scans(scans):
    https_statuses = []
    hsts_statuses = []
    protocol_statuses = []
    cipher_statuses = []
    curve_statuses = []
    certificate_statuses = []
    for scan in scans:
        https_statuses.append(scan["https_status"])
        hsts_statuses.append(scan["hsts_status"])
        certificate_statuses.append(scan["certificate_status"])
        protocol_statuses.append(scan["protocol_status"])
        cipher_statuses.append(scan["cipher_status"])
        curve_statuses.append(scan["curve_status"])

    # Since there are multiple IPs, and there are web scans for each, they need to be combined into one final result
    https = get_status(https_statuses)
    hsts = get_status(hsts_statuses)
    certificate = get_status(certificate_statuses)
    protocol = get_status(protocol_statuses)
    cipher = get_status(cipher_statuses)
    curve = get_status(curve_statuses)

    final_results = {
        "https_status": https,
        "hsts_status": hsts,
        "certificate_status": certificate,
        "protocol_status": protocol,
        "cipher_status": cipher,
        "curve_status": curve
    }
    return final_results                  

def handle_email_notifs(decays, orgs, db):
    results = []
    for org, domains in decays.items():
        for o in orgs:
            if o['orgDetails']['en']['name'] == org:
                org_doc = o
                break
        org_users = get_users(org_doc["_id"], db)
        if domains:
            results.append(send_email_notifs(org_doc, domains, org_users))
    return results

def get_users(org_id, db):
    cursor = db.aql.execute(
        """
        WITH organizations, users
        FOR v, e IN 1 OUTBOUND @org_id affiliations
            FILTER e.permission == "admin" OR e.permission == "owner"
            FILTER v.receiveUpdateEmails == true OR v.emailUpdateOptions.detectDecay == true
            RETURN v
        """,
        bind_vars={"org_id": org_id},
    )
    return cursor

def detect_decay(db):
    decays = {} # Dictionary to hold domains and their decayed statuses for each org
    orgs = [] # List to hold org documents, used for email notifs

    # Loop through each org
    for org in db.collection("organizations"):
        if org.get("verified") is False:
            logger.info(f"Skipping unverified org: {org['orgDetails']['en']['name']}")
            continue
        logger.info(f"Checking {org['orgDetails']['en']['name']} for decays...")
        orgs.append(org)
        try:
            domains_dict = {}
            claims_cursor = db.collection("claims").find({"_from": org["_id"]})
            claims = [claim for claim in claims_cursor]

            # Loop through each domain
            for claim in claims:
                domain = db.collection("domains").get({"_id": claim["_to"]})
                logger.info(f"Checking {domain['domain']} for decays...")

                # Check that domain isn't archived, blocked, or NXDOMAIN
                if not ignore_domain(domain):
                    decayed_statuses = []
                    # Get web scans                   
                    try:
                        all_web_scans = list(get_all_web_scans(domain["_id"], db))
                        final_web_scans = []
                        for web in all_web_scans:
                            scans = web.get("scans")
                            # If there is only one scan, no further steps are needed, just get the statuses
                            if len(scans) == 1:
                                scan = scans[0]
                                https = scan["https_status"]
                                hsts = scan["hsts_status"]
                                certificate = scan["certificate_status"]
                                protocol = scan["protocol_status"]
                                cipher = scan["cipher_status"]
                                curve = scan["curve_status"]
                                final_results = {
                                    "https_status": https,
                                    "hsts_status": hsts,
                                    "certificate_status": certificate,
                                    "protocol_status": protocol,
                                    "cipher_status": cipher,
                                    "curve_status": curve
                                }
                            # If there are multiple scans, combine them into one final scan result
                            else:
                                final_results = finalize_web_scans(scans)                                                  
                            final_web_scans.append(final_results)

                        for i in range(len(final_web_scans) - 1):
                            if final_web_scans[i]["https_status"] == "fail" and final_web_scans[i + 1]["https_status"] == "pass":
                                decayed_statuses.append("HTTPS Configuration")
                            if final_web_scans[i]["hsts_status"] == "fail" and final_web_scans[i + 1]["hsts_status"] == "pass":
                                decayed_statuses.append("HSTS Implementation")
                            if final_web_scans[i]["certificate_status"] == "fail" and final_web_scans[i + 1]["certificate_status"] == "pass":
                                decayed_statuses.append("Certificates")
                            if final_web_scans[i]["protocol_status"] == "fail" and final_web_scans[i + 1]["protocol_status"] == "pass":
                                decayed_statuses.append("Protocols")
                            if final_web_scans[i]["cipher_status"] == "fail" and final_web_scans[i + 1]["cipher_status"] == "pass":
                                decayed_statuses.append("Ciphers")
                            if final_web_scans[i]["curve_status"] == "fail" and final_web_scans[i + 1]["curve_status"] == "pass":
                                decayed_statuses.append("Curves")
                        
                    except Exception as e: 
                        logger.error(f"Error fetching web scans for {domain['domain']}: {e}")

                    # Get dns scans
                    try:
                        all_dns_scans = list(get_all_dns_scans(domain["_id"], db))
                        for i in range(len(all_dns_scans) - 1):
                            if all_dns_scans[i]["dmarc_status"] == "fail" and all_dns_scans[i + 1]["dmarc_status"] == "pass":
                                decayed_statuses.append("DMARC")
                            if all_dns_scans[i]["spf_status"] == "fail" and all_dns_scans[i + 1]["spf_status"] == "pass":
                                decayed_statuses.append("SPF")
                            if all_dns_scans[i]["dkim_status"] == "fail" and all_dns_scans[i + 1]["dkim_status"] == "pass":
                                decayed_statuses.append("DKIM")
                    
                    except Exception as e:
                        logger.error(f"Error fetching dns scans for {domain['domain']}: {e}")
                        continue
                    
                    # Only add if there are actually decayed statuses
                    if len(decayed_statuses) != 0:
                        domains_dict[domain["domain"]] = decayed_statuses
                        logger.info(f"Decays detected for {domain['domain']}: {decayed_statuses}")
                        
            if domains_dict:
                decays[org['orgDetails']['en']['name']] = domains_dict

        except Exception as e:
            logger.error(f"Error processing org {org['orgDetails']['en']['name']}: {e}")

    logger.info(f"Decay Results: {decays}")
    logger.info(f"Decay Results Summary: Total Orgs with Decays = {len(decays)}, Total Domains with Decays = {sum(len(domains) for domains in decays.values())}")
    logger.info(f"Orgs Summary: { {org: len(domains) for org, domains in decays.items()} }")
    decays_copy = copy.deepcopy(decays)
    responses = handle_email_notifs(decays_copy, orgs, db)
    return [decays, responses]

if __name__ == "__main__":
    logger.info("Detect decay service started")
    # Establish DB connection
    client = ArangoClient(hosts=DB_URL)
    db = client.db(DB_NAME, username=DB_USER, password=DB_PASS)
    detect_decay(db)
    logger.info(f"Detect decay service shutting down...")
