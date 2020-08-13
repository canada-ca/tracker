import os
import sys
import time
import json
import logging
import traceback
import emoji
import sqlalchemy
import random
import databases
import asyncio
import datetime
import sqlalchemy
from sqlalchemy.sql import select
from sqlalchemy.dialects.postgresql import ARRAY
from starlette.applications import Starlette
from starlette.routing import Route, Mount, WebSocketRoute
from starlette.responses import PlainTextResponse, JSONResponse
from asyncpg.exceptions import (
    ConnectionDoesNotExistError,
    TooManyConnectionsError,
    UniqueViolationError,
    CannotConnectNowError,
)
from utils import formatted_dictionary

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_HOST = os.getenv("DB_HOST")

DATABASE_URI = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

metadata = sqlalchemy.MetaData()

Domains = sqlalchemy.Table(
    "domains",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("domain", sqlalchemy.String),
    sqlalchemy.Column("last_run", sqlalchemy.DateTime),
    sqlalchemy.Column("selectors", ARRAY(sqlalchemy.String)),
    sqlalchemy.Column(
        "organization_id", sqlalchemy.Integer, sqlalchemy.ForeignKey("organizations.id")
    ),
)

Dmarc_Reports = sqlalchemy.Table(
    "dmarc_reports",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True, autoincrement=True),
    sqlalchemy.Column(
        "domain_id", sqlalchemy.Integer, sqlalchemy.ForeignKey("domains.id")
    ),
    sqlalchemy.Column("start_date", sqlalchemy.DateTime),
    sqlalchemy.Column("end_date", sqlalchemy.DateTime),
    sqlalchemy.Column("report", sqlalchemy.JSON),
    sqlalchemy.Column(
        "organization_id", sqlalchemy.Integer, sqlalchemy.ForeignKey("organizations.id")
    ),
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
    sqlalchemy.Column(
        "failed_login_attempt_time", sqlalchemy.Float, default=0, nullable=True
    ),
    sqlalchemy.Column("tfa_validated", sqlalchemy.Boolean, default=False),
)

User_affiliations = sqlalchemy.Table(
    "user_affiliations",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True, autoincrement=True),
    sqlalchemy.Column(
        "user_id",
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey(
            "users.id",
            onupdate="CASCADE",
            ondelete="CASCADE",
            name="user_affiliations_users_id_fkey",
        ),
        primary_key=True,
    ),
    sqlalchemy.Column(
        "organization_id",
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey(
            "organizations.id",
            onupdate="CASCADE",
            ondelete="CASCADE",
            name="user_affiliations_organization_id_fkey",
        ),
    ),
    sqlalchemy.Column("permission", sqlalchemy.String),
)

Web_scans = sqlalchemy.Table(
    "web_scans",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column(
        "domain_id", sqlalchemy.Integer, sqlalchemy.ForeignKey("domains.id")
    ),
    sqlalchemy.Column("scan_date", sqlalchemy.DateTime),
    sqlalchemy.Column(
        "initiated_by", sqlalchemy.Integer, sqlalchemy.ForeignKey("users.id")
    ),
)

Mail_scans = sqlalchemy.Table(
    "mail_scans",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column(
        "domain_id", sqlalchemy.Integer, sqlalchemy.ForeignKey("domains.id")
    ),
    sqlalchemy.Column("scan_date", sqlalchemy.DateTime),
    sqlalchemy.Column("selectors", ARRAY(sqlalchemy.String)),
    sqlalchemy.Column("dmarc_phase", sqlalchemy.Integer),
    sqlalchemy.Column(
        "initiated_by", sqlalchemy.Integer, sqlalchemy.ForeignKey("users.id")
    ),
)

Dmarc_scans = sqlalchemy.Table(
    "dmarc_scans",
    metadata,
    sqlalchemy.Column(
        "id",
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("mail_scans.id"),
        primary_key=True,
    ),
    sqlalchemy.Column("dmarc_scan", sqlalchemy.JSON),
)

Dkim_scans = sqlalchemy.Table(
    "dkim_scans",
    metadata,
    sqlalchemy.Column(
        "id",
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("mail_scans.id"),
        primary_key=True,
    ),
    sqlalchemy.Column("dkim_scan", sqlalchemy.JSON),
)

Mx_scans = sqlalchemy.Table(
    "mx_scans",
    metadata,
    sqlalchemy.Column(
        "id",
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("mail_scans.id"),
        primary_key=True,
    ),
    sqlalchemy.Column("mx_scan", sqlalchemy.JSON),
)

Spf_scans = sqlalchemy.Table(
    "spf_scans",
    metadata,
    sqlalchemy.Column(
        "id",
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("mail_scans.id"),
        primary_key=True,
    ),
    sqlalchemy.Column("spf_scan", sqlalchemy.JSON),
)

Https_scans = sqlalchemy.Table(
    "https_scans",
    metadata,
    sqlalchemy.Column(
        "id",
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("web_scans.id"),
        primary_key=True,
    ),
    sqlalchemy.Column("https_scan", sqlalchemy.JSON),
)

Ssl_scans = sqlalchemy.Table(
    "ssl_scans",
    metadata,
    sqlalchemy.Column(
        "id",
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("web_scans.id"),
        primary_key=True,
    ),
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

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

MIN_HSTS_AGE = 31536000  # one year


def process_https(results):
    logging.info("Processing HTTPS scan results...")
    report = {}

    if results is None or results == {}:
        report = {"missing": True}

    else:
        # Assumes that HTTPS would be technically present, with or without issues
        if results["Downgrades HTTPS"]:
            https = "Downgrades HTTPS"  # No
        else:
            if results["Valid HTTPS"]:
                https = "Valid HTTPS"  # Yes
            elif results["HTTPS Bad Chain"] and not results["HTTPS Bad Hostname"]:
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
            elif not results["Strictly Forces HTTPS"] and results["Defaults to HTTPS"]:
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

    logging.info(f"Processed HTTPS scan results: {str(report)}")
    return report


def process_ssl(results):
    logging.info("Processing SSL scan results...")
    report = {}

    # Get cipher/protocol data via sslyze for a host.

    if results is None or results == {}:
        report = {"missing": True}

    else:
        ###
        # BOD 18-01 (cyber.dhs.gov) cares about SSLv2, SSLv3, RC4, and 3DES.
        any_rc4 = results.get("rc4", "False")

        any_3des = results.get("3des", "False")

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

        signature_algorithm = results.get("signature_algorithm", "unknown")

        heartbleed = results.get("is_vulnerable_to_heartbleed", False)
        ccs_injection = results.get("is_vulnerable_to_ccs_injection", False)

        if signature_algorithm in ["SHA256", "SHA384", "AEAD"]:
            good_cert = True
        else:
            good_cert = False

        strong_ciphers = []
        acceptable_ciphers = []
        weak_ciphers = []
        for cipher in results["TLS"]["accepted_cipher_list"]:
            if "RC4" in cipher or "3DES" in cipher:
                weak_ciphers.append(cipher)
            elif ("ECDHE" in cipher) and ("GCM" in cipher or "CHACHA20" in cipher):
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

    logging.info(f"Processed SSL scan results: {str(report)}")
    return report


def process_dns(results):
    logging.info("Processing DNS scan results...")

    if results is not None and results != {}:
        report = {
            "dmarc": results["dmarc"],
            "spf": results["spf"],
            "mx": results["mx"],
            "dkim": results["dkim"],
        }
    else:
        report = {
            "dmarc": {"missing": True},
            "spf": {"missing": True},
            "mx": {"missing": True},
            "dkim": {"missing": True},
        }

    logging.info(f"Processed DNS scan results: {str(report)}")
    return report


async def insert_https(report, scan_id, db):

    try:
        await db.connect()
        scan_query = select([Web_scans]).where(Web_scans.c.id == scan_id)
        scan = await db.fetch_one(scan_query)
        logging.info(f"Retrieved corresponding scan from database: {str(scan)}")

        insert_query = Https_scans.insert().values(
            https_scan={"https": report}, id=scan.get("id")
        )
        await db.execute(insert_query)
        await db.disconnect()
    except Exception as e:
        try:
            await db.disconnect()
        except:
            pass
        logging.error(
            f"(HTTPS SCAN, ID={scan_id}, TIME={datetime.datetime.utcnow()}) - An unknown exception occurred while attempting database insertion(s): {str(e)}"
        )
        logging.error(
            f"(HTTPS SCAN, ID={scan_id}, TIME={datetime.datetime.utcnow()}) - Full traceback: {traceback.format_exc()}"
        )

    logging.info("HTTPS Scan inserted into database")


async def insert_ssl(report, scan_id, db):

    try:
        await db.connect()
        scan_query = select([Web_scans]).where(Web_scans.c.id == scan_id)
        scan = await db.fetch_one(scan_query)
        logging.info(f"Retrieved corresponding scan from database: {str(scan)}")

        insert_query = Ssl_scans.insert().values(
            ssl_scan={"ssl": report}, id=scan.get("id")
        )
        await db.execute(insert_query)
        await db.disconnect()
    except Exception as e:
        try:
            await db.disconnect()
        except:
            pass
        logging.error(
            f"(SSL SCAN, ID={scan_id}, TIME={datetime.datetime.utcnow()}) - An unknown exception occurred while attempting database insertion(s): {str(e)}"
        )
        logging.error(
            f"(SSL SCAN, ID={scan_id}, TIME={datetime.datetime.utcnow()}) - Full traceback: {traceback.format_exc()}"
        )

    logging.info("SSL Scan inserted into database")


async def insert_dns(report, scan_id, db):

    try:
        await db.connect()
        scan_query = select([Mail_scans]).where(Mail_scans.c.id == scan_id)
        scan = await db.fetch_one(scan_query)
        logging.info(f"Retrieved corresponding scan from database: {str(scan)}")

        if report["dkim"].get("missing", False) is not True:
            # Check for previous dkim scans on this domain
            previous_scan_query = select([Mail_scans]).where(
                Mail_scans.c.domain_id == scan.get("domain_id")
            )

            previous_scans = await db.fetch_all(previous_scan_query)

            historical_dkim = None
            # If public key has been in use for a year or more, recommend update
            for previous_scan in previous_scans:
                if (scan.get("scan_date") - previous_scan.get("scan_date")).days >= 365:
                    historical_dkim_query = select([Dkim_scans]).where(
                        Dkim_scans.c.id == previous_scan.get("id")
                    )
                    historical_dkim = await db.fetch_one(historical_dkim_query)

            if historical_dkim is not None:
                for selector in report["dkim"]:
                    for historical_selector in historical_dkim.get("dkim_scan")["dkim"]:
                        if selector == historical_selector:
                            if (
                                report["dkim"]["selector"]["public_key_modulus"]
                                == historical_selector["public_key_modulus"]
                            ):
                                report["dkim"]["selector"]["update-recommended"] = True

        dmarc_insert_query = Dmarc_scans.insert().values(
            dmarc_scan={"dmarc": report["dmarc"]}, id=scan.get("id")
        )
        mx_insert_query = Mx_scans.insert().values(
            mx_scan={"mx": report["mx"]}, id=scan.get("id")
        )
        spf_insert_query = Spf_scans.insert().values(
            spf_scan={"spf": report["spf"]}, id=scan.get("id")
        )
        dkim_insert_query = Dkim_scans.insert().values(
            dkim_scan={"dkim": report["dkim"]}, id=scan.get("id")
        )

        await db.execute(dmarc_insert_query)
        await db.execute(mx_insert_query)
        await db.execute(spf_insert_query)
        await db.execute(dkim_insert_query)
        await db.disconnect()
    except Exception as e:
        try:
            await db.disconnect()
        except:
            pass
        logging.error(
            f"(DNS SCAN, ID={scan_id}, TIME={datetime.datetime.utcnow()}) - An unknown exception occurred while attempting database insertion(s): {str(e)}"
        )
        logging.error(
            f"(DNS SCAN, ID={scan_id}, TIME={datetime.datetime.utcnow()}) - Full traceback: {traceback.format_exc()}"
        )

    logging.info("DNS Scans inserted into database")


DEFAULT_FUNCTIONS = {
    "insert": {"https": insert_https, "ssl": insert_ssl, "dns": insert_dns,},
    "process": {"https": process_https, "ssl": process_ssl, "dns": process_dns,},
}


def Server(database_uri=DATABASE_URI, functions=DEFAULT_FUNCTIONS):

    async_db = databases.Database(database_uri)

    async def process(result_request):
        logging.info(f"Results received.")
        payload = await result_request.json()
        try:
            payload_dict = formatted_dictionary(str(payload))
            try:
                results = payload_dict["results"]
                scan_type = payload_dict["scan_type"]
                scan_id = payload_dict["scan_id"]
                logging.info(
                    f"Results received for {scan_type} scan with ID {scan_id} (TIME={datetime.datetime.utcnow()})"
                )
            except KeyError:
                msg = f"Invalid result format received: {str(payload_dict)}"
                logging.error(msg)
                return PlainTextResponse(msg)

            report = functions["process"][scan_type](results)

            await functions["insert"][scan_type](report, scan_id, async_db)

            return PlainTextResponse(
                f"{scan_type} results processed and inserted successfully (ID={scan_id}, TIME={datetime.datetime.utcnow()})."
            )

        except Exception as e:
            msg = f"An error occurred while attempting to process results: ({type(e).__name__}: {str(e)})"
            logging.error(msg)
            return PlainTextResponse(msg)

    async def startup():
        logging.info(emoji.emojize("ASGI server started :rocket:"))

    async def shutdown():
        logging.info(emoji.emojize("ASGI server shutting down..."))

    routes = [
        Route("/", process, methods=["POST"]),
    ]

    starlette_app = Starlette(
        debug=True, routes=routes, on_startup=[startup], on_shutdown=[shutdown]
    )

    return starlette_app


app = Server()
