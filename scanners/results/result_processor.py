import os
import sys
import json
import logging
import requests
import emoji
import sqlalchemy
from sqlalchemy.sql import select
import databases
from starlette.applications import Starlette
from starlette.routing import Route, Mount, WebSocketRoute
from starlette.responses import PlainTextResponse, JSONResponse
from starlette.config import Config
from utils import formatted_dictionary


logging.basicConfig(stream=sys.stdout, level=logging.INFO)

MIN_HSTS_AGE = 31536000  # one year

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_HOST = os.getenv("DB_HOST")

config = Config('.env')
DATABASE_URI = f"postgresql://{Config('DB_USER')}:{Config(DB_PASS)}@{Config(DB_HOST)}:{Config(DB_PORT)}/{Config(DB_NAME)}"

metadata = sqlalchemy.MetaData()

Domains = sqlalchemy.Table(
    "domains",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("domain", sqlalchemy.String),
    sqlalchemy.Column("last_run", sqlalchemy.DateTime),
    sqlalchemy.Column("organization_id", sqlalchemy.Integer, sqlalchemy.ForeignKey("organizations.id")),
)

Dmarc_Reports = sqlalchemy.Table(
    "dmarc_reports",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True, autoincrement=True),
    sqlalchemy.Column("domain_id", sqlalchemy.Integer, sqlalchemy.ForeignKey("domains.id")),
    sqlalchemy.Column("start_date", sqlalchemy.DateTime),
    sqlalchemy.Column("end_date", sqlalchemy.DateTime),
    sqlalchemy.Column("report", sqlalchemy.JSON),
    sqlalchemy.Column("organization_id", sqlalchemy.Integer, sqlalchemy.ForeignKey("organizations.id")),
)

Organizations = sqlalchemy.Table(
    "organizations",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("name", sqlalchemy.String),
    sqlalchemy.Column("slug", sqlalchemy.String, index=True),
    sqlalchemy.Column("acronym", sqlalchemy.String),
    sqlalchemy.Column("org_tags", sqlalchemy.JSON),
)

Users = sqlalchemy.Table(
    "users",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True, autoincrement=True),
    sqlalchemy.Column("user_name", sqlalchemy.String),
    sqlalchemy.Column("display_name", sqlalchemy.String),
    sqlalchemy.Column("user_password", sqlalchemy.String),
    sqlalchemy.Column("preferred_lang", sqlalchemy.String),
    sqlalchemy.Column("failed_login_attempts", sqlalchemy.Integer, default=0),
    sqlalchemy.Column("failed_login_attempt_time", sqlalchemy.Float, default=0, nullable=True),
    sqlalchemy.Column("tfa_validated", sqlalchemy.Boolean, default=False),
)

User_affiliations = sqlalchemy.Table(
    "user_affiliations",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True, autoincrement=True),
    sqlalchemy.Column("user_id", sqlalchemy.Integer, sqlalchemy.ForeignKey("users.id", onupdate="CASCADE", ondelete="CASCADE", name="user_affiliations_users_id_fkey"), primary_key=True),
    sqlalchemy.Column("organization_id", sqlalchemy.Integer, sqlalchemy.ForeignKey("organizations.id", onupdate="CASCADE", ondelete="CASCADE", name="user_affiliations_organization_id_fkey")),
    sqlalchemy.Column("permission", sqlalchemy.String),
)

Scans = sqlalchemy.Table(
    "scans",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("domain_id", sqlalchemy.Integer, sqlalchemy.ForeignKey("domains.id")),
    sqlalchemy.Column("scan_date", sqlalchemy.DateTime),
    sqlalchemy.Column("initiated_by", sqlalchemy.Integer, sqlalchemy.ForeignKey("users.id")),
    sqlalchemy.Column("org_tags", sqlalchemy.JSON),
)

Dmarc_scans = sqlalchemy.Table(
    "dmarc_scans",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, sqlalchemy.ForeignKey("scans.id"), primary_key=True),
    sqlalchemy.Column("dmarc_phase", sqlalchemy.Integer),
    sqlalchemy.Column("dmarc_scan", sqlalchemy.JSON),
)

Dkim_scans = sqlalchemy.Table(
    "dkim_scans",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, sqlalchemy.ForeignKey("scans.id"), primary_key=True),
    sqlalchemy.Column("dkim_scan", sqlalchemy.JSON),
)

Mx_scans = sqlalchemy.Table(
    "mx_scans",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, sqlalchemy.ForeignKey("scans.id"), primary_key=True),
    sqlalchemy.Column("mx_scan", sqlalchemy.JSON),
)

Spf_scans = sqlalchemy.Table(
    "spf_scans",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, sqlalchemy.ForeignKey("scans.id"), primary_key=True),
    sqlalchemy.Column("spf_scan", sqlalchemy.JSON),
)

Https_scans = sqlalchemy.Table(
    "https_scans",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, sqlalchemy.ForeignKey("scans.id"), primary_key=True),
    sqlalchemy.Column("https_scan", sqlalchemy.JSON),
)

Ssl_scans = sqlalchemy.Table(
    "ssl_scans",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, sqlalchemy.ForeignKey("scans.id"), primary_key=True),
    sqlalchemy.Column("ssl_scan", sqlalchemy.JSON),
)

Ciphers = sqlalchemy.Table(
    "ciphers",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("cipher_type", sqlalchemy.String),
)

Guidance = sqlalchemy.Table(
    "guidance",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("tag_name", sqlalchemy.String),
    sqlalchemy.Column("guidance", sqlalchemy.String),
    sqlalchemy.Column("ref_links", sqlalchemy.String),
)

Classification = sqlalchemy.Table(
    "classification",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("UNCLASSIFIED", sqlalchemy.String),
)


def startup():
    logging.info(emoji.emojize("ASGI server started :rocket:"))


def initiate(payload):

    logging.info("Results received")

    try:
        payload_dict = formatted_dictionary(payload)

        process_response = requests.post('http://127.0.0.1:8000/process', json=payload_dict)

        payload_dict["results"] = process_response.json()

        insert_response = requests.post('http://127.0.0.1:8000/insert', json=payload_dict)

        return f'Results processed successfully: {insert_response.text}'

    except Exception as e:
        logging.error("Failed: %s" % str(e))
        return "An error occurred while processing results: %s" % str(e)


def process_results(results, scan_type):

    report = {}

    try:
        report = globals()["process_"+scan_type](results, scan_type)
    except Exception as e:
        logging.error(f'An error occurred while processing results: {str(e)}')

    return report


def process_https(results):
    report = {}

    if results is None:
        report = {"missing": True}

    else:
        # Assumes that HTTPS would be technically present, with or without issues
        if results["Downgrades HTTPS"]:
            https = "Downgrades HTTPS"  # No
        else:
            if results["Valid HTTPS"]:
                https = "Valid HTTPS"  # Yes
            elif (
                results["HTTPS Bad Chain"] and not results["HTTPS Bad Hostname"]
            ):
                https = "Bad Chain"  # Yes
            else:
                https = "Bad Hostname"  # No

        report["implementation"] = https

        # Is HTTPS enforced?

        if https == ("Downgrades HTTPS" or "Bad Hostname"):
            behavior = "Not Enforced"  # N/A

        else:

            # "Strict" means HTTP immediately redirects to HTTPS,
            # *and* that HTTP eventually redirects to HTTPS.
            #
            # Since a pure redirector domain can't "default" to HTTPS
            # for itself, we'll say it "Enforces HTTPS" if it immediately
            # redirects to an HTTPS URL.
            if results["Strictly Forces HTTPS"] and (
                results["Defaults to HTTPS"] or results["Redirect"]
            ):
                behavior = "Strict"  # Yes (Strict)

            # "Moderate" means HTTP eventually redirects to HTTPS.
            elif (
                not results["Strictly Forces HTTPS"]
                and results["Defaults to HTTPS"]
            ):
                behavior = "Moderate"  # Yes

            # Either both are False, or just 'Strict Force' is True,
            # which doesn't matter on its own.
            # A "present" is better than a downgrade.
            else:
                behavior = "Weak"  # Present (considered 'No')

        report["enforced"] = behavior

        ###
        # Characterize the presence and completeness of HSTS.

        if results["HSTS Max Age"]:
            hsts_age = int(results["HSTS Max Age"])
        else:
            hsts_age = None

        # Otherwise, without HTTPS there can be no HSTS for the domain directly.
        if https == "Downgrades HTTPS" or https == "Bad Hostname":
            hsts = "No HSTS"  # N/A (considered 'No')

        else:

            # HSTS is present for the canonical endpoint.
            if results["HSTS"] and hsts_age is not None:

                # Say No for too-short max-age's, and note in the extended details.
                if hsts_age >= MIN_HSTS_AGE:
                    hsts = "HSTS Fully Implemented"  # Yes, directly
                else:
                    hsts = "HSTS Max Age Too Short"  # No
            else:
                hsts = "No HSTS"  # No

        # Separate preload status from HSTS status:
        #
        # * Domains can be preloaded through manual overrides.
        # * Confusing to mix an endpoint-level decision with a domain-level decision.
        if results["HSTS Preloaded"]:
            preloaded = "HSTS Preloaded"  # Yes
        elif results["HSTS Preload Ready"]:
            preloaded = "HSTS Preload Ready"  # Ready for submission
        else:
            preloaded = "HSTS Not Preloaded"  # No

        # Certificate info
        if results["HTTPS Expired Cert"]:
            expired = True
        else:
            expired = False

        if results["HTTPS Self Signed Cert"]:
            self_signed = True
        else:
            self_signed = False

        report["hsts"] = hsts
        report["hsts_age"] = hsts_age
        report["preload_status"] = preloaded
        report["expired_cert"] = expired
        report["self_signed_cert"] = self_signed

    return report


def process_ssl(results):
    report = {}

    # Get cipher/protocol data via sslyze for a host.

    if results is None:
        report = {"missing": True}

    else:
        ###
        # BOD 18-01 (cyber.dhs.gov) cares about SSLv2, SSLv3, RC4, and 3DES.
        any_rc4 = results["rc4"]

        any_3des = results["3des"]

        ###
        # ITPIN cares about usage of TLS 1.0/1.1/1.2

        for version in [
            "SSL_2_0",
            "SSL_3_0",
            "TLS_1_0",
            "TLS_1_1",
            "TLS_1_2",
            "TLS_1_3",
        ]:
            if version in results["TLS"]["supported"]:
                report[version] = True
            else:
                report[version] = False

        signature_algorithm = results["signature_algorithm"]

        heartbleed = results.get("is_vulnerable_to_heartbleed", False)
        ccs_injection = results.get("is_vulnerable_to_ccs_injection", False)

        if results["signature_algorithm"] in ["SHA256", "SHA384", "AEAD"]:
            good_cert = True
        else:
            good_cert = False

        strong_ciphers = []
        acceptable_ciphers = []
        weak_ciphers = []
        for cipher in results["TLS"]["accepted_cipher_list"]:
            if "RC4" in cipher or "3DES" in cipher:
                weak_ciphers.append(cipher)
            elif ("ECDHE" in cipher) and (
                "GCM" in cipher or "CHACHA20" in cipher
            ):
                strong_ciphers.append(cipher)
            elif "ECDHE" in cipher or "DHE" in cipher:
                acceptable_ciphers.append(cipher)
            else:
                weak_ciphers.append(cipher)

        report["rc4"] = any_rc4
        report["3des"] = any_3des
        report["strong_ciphers"] = strong_ciphers
        report["acceptable_ciphers"] = acceptable_ciphers
        report["weak_ciphers"] = weak_ciphers
        report["acceptable_certificate"] = good_cert
        report["signature_algorithm"] = signature_algorithm
        report["preferred_cipher"] = results["TLS"]["preferred_cipher"]
        report["heartbleed"] = heartbleed
        report["openssl_ccs_injection"] = ccs_injection

    return report


def process_dmarc(results):

    if results is not None:
        report = {
            "dmarc": results["dmarc"],
            "spf": results["spf"],
            "mx": results["mx"],
        }
    else:
        report = {
            "dmarc": {"missing": True},
            "spf": {"missing": True},
            "mx": {"missing": True},
        }

    return report


def process_dkim(results):

    if results is not None:
        report = results
    else:
        report = {"missing": True}

    return report


async def insert_results(report, scan_type, scan_id, db):

    try:
        await db.connect()

        scan_query = select(Scans).where(Scans.c.id == scan_id)
        scan = await db.fetch_one(scan_query)
        logging.info(f'Retrieved corresponding scan from database: {str(scan)}')

        response = await globals()["insert_"+scan_type](report, scan, db)

        logging.info(response.text)

    except Exception as e:
        logging.error(f'Failed database insertion(s): {str(e)}')
        await db.disconnect()

    await db.disconnect()


async def insert_https(report, scan, db):
    finalized_report = json.JSONEncoder().encode(str(report))

    insert_query = Https_scans.insert().values(https_scan=json.dumps({"https": finalized_report}), id=scan.id)
    await db.execute(insert_query)
    return "HTTPS Scan inserted into database"


async def insert_ssl(report, scan, db):
    finalized_report = json.JSONEncoder().encode(str(report))

    insert_query = Ssl_scans.insert().values(https_scan=json.dumps({"ssl": finalized_report}), id=scan.id)
    await db.execute(insert_query)
    return "SSL Scan inserted into database"


async def insert_dmarc(report, scan, db):
    finalized_dmarc_report = json.JSONEncoder().encode(str(report["dmarc"]))
    finalized_mx_report = json.JSONEncoder().encode(str(report["mx"]))
    finalized_spf_report = json.JSONEncoder().encode(str(report["spf"]))

    dmarc_insert_query = Dmarc_scans.insert().values(dmarc_scan=json.dumps({"dmarc": finalized_dmarc_report}),
                                                     id=scan.id)
    mx_insert_query = Mx_scans.insert().values(mx_scan=json.dumps({"mx": finalized_mx_report}), id=scan.id)
    spf_insert_query = Spf_scans.insert().values(spf_scan=json.dumps({"dmarc": finalized_spf_report}), id=scan.id)

    await db.execute(dmarc_insert_query)
    await db.execute(mx_insert_query)
    await db.execute(spf_insert_query)

    return "DMARC/MX/SPF Scans inserted into database"


async def insert_dkim(report, scan, db):
    finalized_report = json.JSONEncoder().encode(str(report))

    # Check for previous dkim scans on this domain
    previous_scan_query = select(Scans).where(Scans.c.domain_id == scan.c.domain_id)

    previous_scans = await db.fetch_all(previous_scan_query)

    update_recommended = False

    # If public key has been in use for a year or more, recommend update
    for previous_scan in previous_scans:
        if (scan.scan_date - previous_scan.scan_date).days >= 365:
            historical_dkim_query = select(Dkim_scans).where(Dkim_scans.c.id == previous_scan.c.id)
            historical_dkim = await db.fetch_one(historical_dkim_query)
            if (
                report["public_key_modulus"]
                == historical_dkim.c.dkim_scan["dkim"]["public_key_modulus"]
            ):
                update_recommended = True

    report["update-recommended"] = update_recommended
    insert_query = Dkim_scans.insert().values(dkim_scan=json.dumps({"dkim": finalized_report}), id=scan.id)
    await db.execute(insert_query)
    logging.info("DKIM Scan inserted into database")


def Server(functions={}, database_uri=DATABASE_URI):

    database = databases.Database(database_uri)

    async def receive(request):
        logging.info("Request received")
        payload = await request.json()
        return PlainTextResponse(initiate(payload))

    async def insert(request):
        try:
            payload = await request.json()
            logging.info("Inserting results...")
            results = payload["results"]
            scan_id = payload["scan_id"]
            scan_type = payload["scan_type"]
            await functions["insert"](results, scan_type, scan_id, database)
        except Exception as e:
            return PlainTextResponse(str(e))
        return PlainTextResponse("Database insertion(s) completed")

    async def process(request):
        payload = await request.json()
        logging.info("Processing results...")
        return JSONResponse(functions["process"](payload["scan_type"], payload["results"]))

    routes = [
        Route('/insert', insert, methods=['POST']),
        Route('/process', process, methods=['POST']),
        Route('/receive', receive, methods=['POST']),
    ]

    return Starlette(debug=True, routes=routes, on_startup=[startup])


app = Server(functions={"insert": insert_results, "process": process_results})
