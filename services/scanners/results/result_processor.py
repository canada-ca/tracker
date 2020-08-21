import os
import re
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


def process_https(results):
    tags = []

    if results.get("missing", None) is not None:
        tags.append("https2")
        return tags

    # Implementation
    implementation = results.get("implementation", None)

    if implementation is not None:
        if isinstance(implementation, str):
            implementation = implementation.lower()

        if implementation == "downgrades https":
            tags.append("https3")
        elif implementation == "bad chain":
            tags.append("https4")
        elif implementation == "bad hostname":
            tags.append("https5")

    # Enforced
    enforced = results.get("enforced", None)

    if enforced is not None:
        if isinstance(enforced, str):
            enforced = enforced.lower()

        if enforced == "moderate":
            tags.append("https8")
        elif enforced == "weak":
            tags.append("https7")
        elif enforced == "not enforced":
            tags.append("https6")

    # HSTS
    hsts = results.get("hsts", None)

    if hsts is not None:
        if isinstance(hsts, str):
            hsts = hsts.lower()

        if hsts == "hsts max age too short":
            tags.append("https10")
        elif hsts == "no hsts":
            tags.append("https9")

    # HSTS Age
    hsts_age = results.get("hsts_age", None)

    if hsts_age is not None:
        if hsts_age < 31536000 and "https" not in tags:
            tags.append("https10")

    # Preload Status
    preload_status = results.get("preload_status", None)

    if preload_status is not None:
        if isinstance(preload_status, str):
            preload_status = preload_status.lower()

        if preload_status == "hsts preload ready":
            tags.append("https11")
        elif preload_status == "hsts not preloaded":
            tags.append("https12")

    # Expired Cert
    expired_cert = results.get("expired_cert", None)

    if expired_cert is not None:
        if expired_cert is True:
            tags.append("https13")

    # Self Signed Cert
    self_signed_cert = results.get("https", {}).get("self_signed_cert", None)

    if self_signed_cert is not None:
        if self_signed_cert is True:
            tags.append("https14")

    return tags


def process_ssl(results):
    tags = []

    if results.get("missing", None) is not None:
        tags.append("ssl2")
        return tags

    # SSL-rc4
    ssl_rc4 = results.get("rc4", None)
    if ssl_rc4 is not None:
        if ssl_rc4 is True:
            tags.append("ssl3")

    # SSL-3des
    ssl_3des = results.get("3des", None)
    if ssl_3des is not None:
        if ssl_3des is True:
            tags.append("ssl4")

    # Signature Algorithm
    signature_algorithm = results.get("signature_algorithm", None)

    if signature_algorithm is not None:
        if isinstance(signature_algorithm, str):
            signature_algorithm = signature_algorithm.lower()

        if (
            signature_algorithm == "sha-256"
            or signature_algorithm == "sha-384"
            or signature_algorithm == "aead"
        ):
            tags.append("ssl5")
        else:
            tags.append("ssl6")
    else:
        tags.append("ssl6")

    # Heartbleed
    heart_bleed = results.get("heartbleed", None)

    if heart_bleed is not None:
        if heart_bleed is True:
            tags.append("ssl7")

    # openssl ccs injection
    openssl_ccs_injection = results.get("ssl", {}).get("openssl_ccs_injection", None)

    if openssl_ccs_injection is not None:
        if openssl_ccs_injection is True:
            tags.append("ssl8")

    return tags


def process_dns(results):
    tags = {"dmarc": [], "dkim": [], "spf": []}

    if results["dkim"].get("missing", None) is not None:
        tags["dkim"].append("dkim2")

    # Get Key Size, and Key Type
    key_size = results["dkim"].get("key_size", None)
    key_type = results["dkim"].get("key_type", None)

    if key_size is None:
        tags["dkim"].append("dkim9")
    elif key_type is None:
        tags["dkim"].append("dkim9")
    else:
        if key_size >= 4096 and key_type == "rsa":
            tags["dkim"].append("dkim8")
        elif key_size >= 2048 and key_type == "rsa":
            tags["dkim"].append("dkim7")
        elif key_size == 1024 and key_type == "rsa":
            tags["dkim"].append("dkim6")
        elif key_size < 1024 and key_type == "rsa":
            tags["dkim"].append("dkim5")
        else:
            tags["dkim"].append("dkim9")

    # Update Recommended
    key_invalid = results["dkim"].get("update-recommend", None)

    if key_invalid is not None:
        if key_invalid is True:
            tags["dkim"].append("dkim10")

    # Invalid Crypto
    invalid_crypto = results["dkim"].get("txt_record", {}).get("k", None)

    if invalid_crypto is not None:
        # if k != rsa
        if invalid_crypto != "rsa":
            tags["dkim"].append("dkim11")

    # Dkim value invalid
    # Check if v, k, and p exist in txt_record
    v_tag = results["dkim"].get("txt_record", {}).get("v", None)
    k_tag = results["dkim"].get("txt_record", {}).get("k", None)
    p_tag = results["dkim"].get("txt_record", {}).get("p", None)

    if v_tag is None and k_tag is None and p_tag is None:
        if "dkim12" not in tags:
            tags["dkim"].append("dkim12")

    # Testing Enabled
    t_enabled = results["dkim"].get("t_value", None)
    if t_enabled is not None:
        tags["dkim"].append("dkim13")

    if results["dmarc"].get("missing", None) is not None:
        tags["dmarc"].append("dmarc2")

    # Check P Policy Tag
    p_policy_tag = (
        results["dmarc"]
        .get("dmarc", {})
        .get("tags", {})
        .get("p", {})
        .get("value", None)
    )

    if p_policy_tag is not None:
        if isinstance(p_policy_tag, str):
            p_policy_tag = p_policy_tag.lower()

        if p_policy_tag == "missing":
            tags["dmarc"].append("dmarc3")
        elif p_policy_tag == "none":
            tags["dmarc"].append("dmarc4")
        elif p_policy_tag == "quarantine":
            tags["dmarc"].append("dmarc5")
        elif p_policy_tag == "reject":
            tags["dmarc"].append("dmarc6")

    # Check PCT Tag
    pct_tag = (
        results["dmarc"]
        .get("dmarc", {})
        .get("tags", {})
        .get("pct", {})
        .get("value", None)
    )

    if pct_tag is not None:
        if isinstance(pct_tag, str):
            pct_tag = pct_tag.lower()
            if pct_tag == "invalid":
                tags["dmarc"].append("dmarc9")
            elif pct_tag == "none":
                tags["dmarc"].append("dmarc20")
        elif isinstance(pct_tag, int):
            if pct_tag == 100:
                tags["dmarc"].append("dmarc7")
            elif 100 > pct_tag > 0:
                tags["dmarc"].append("dmarc8")
            else:
                tags["dmarc"].append("dmarc21")

    # Check RUA Tag
    rua_tag = (
        results["dmarc"]
        .get("dmarc", {})
        .get("tags", {})
        .get("rua", {})
        .get("value", None)
    )

    if rua_tag is None or not rua_tag:
        tags["dmarc"].append("dmarc12")
    else:
        if isinstance(rua_tag, str):
            rua_tag = rua_tag.lower()
        for value in rua_tag:
            if value["address"] == "dmarc@cyber.gc.ca":
                tags["dmarc"].append("dmarc10")
            else:
                tags["dmarc"].append("dmarc12")

    # Check RUF Tag
    ruf_tag = (
        results["dmarc"]
        .get("dmarc", {})
        .get("tags", {})
        .get("ruf", {})
        .get("value", None)
    )

    if ruf_tag is None or not ruf_tag:
        tags["dmarc"].append("dmarc13")
    else:
        if isinstance(ruf_tag, str):
            ruf_tag = ruf_tag.lower()
        for value in ruf_tag:
            if value["address"] == "dmarc@cyber.gc.ca":
                tags["dmarc"].append("dmarc11")
            else:
                tags["dmarc"].append("dmarc13")

    # TXT DMARC
    record_tag = results["dmarc"].get("dmarc", {}).get("record", None)
    if record_tag == "" or record_tag is None:
        tags["dmarc"].append("dmarc15")
    else:
        tags["dmarc"].append("dmarc14")

    # Check SP tag
    sp_tag = (
        results["dmarc"]
        .get("dmarc", {})
        .get("tags", {})
        .get("sp", {})
        .get("value", None)
    )

    if sp_tag is not None:
        if isinstance(sp_tag, str):
            sp_tag = sp_tag.lower()

        if sp_tag == "missing":
            tags["dmarc"].append("dmarc16")
        elif sp_tag == "none":
            tags["dmarc"].append("dmarc17")
        elif sp_tag == "quarantine":
            tags["dmarc"].append("dmarc18")
        elif sp_tag == "reject":
            tags["dmarc"].append("dmarc19")

    if results["spf"].get("missing", None) is not None:
        tags["spf"].append("spf2")
        return tags

    dkim_record = results["dkim"].get("txt_record", None)
    if dkim_record is not None:
        for key in dkim_record:
            if key == "a" or key == "include":
                tags["spf"].append("spf3")

    dmarc_record = results["dmarc"].get("record", None)
    if dmarc_record is not None:
        if (
            ("include:" in dmarc_record)
            or ("a:" in dmarc_record)
            or ("all" in dmarc_record)
        ):
            if "spf3" not in tags:
                tags["spf"].append("spf3")

    # Check all tag
    all_tag = results["spf"].get("parsed", {}).get("all", None)
    record_all_tag = results["spf"].get("record", None)

    if (all_tag is not None) and (record_all_tag is not None):
        if isinstance(all_tag, str) and isinstance(record_all_tag, str):
            all_tag = all_tag.lower()
            record_all_tag = record_all_tag[-4:].lower()

            if record_all_tag != "-all" and record_all_tag != "~all":
                tags["spf"].append("spf10")
            elif all_tag == "missing":
                tags["spf"].append("spf4")
            elif all_tag == "allow":
                tags["spf"].append("spf5")
            elif all_tag == "neutral":
                tags["spf"].append("spf6")
            elif all_tag == "redirect":
                tags["spf"].append("spf9")
            elif all_tag == "fail":
                if record_all_tag == "-all":
                    tags["spf"].append("spf8")
                elif record_all_tag == "~all":
                    tags["spf"].append("spf7")

    # Check for no host
    record = results["spf"].get("record", None)
    if record is not None:
        search_string = "a:"
        matches = re.finditer(search_string, record)
        match_pos = [match.start() for match in matches]

        for pos in match_pos:
            if record[pos + 1 : 1] == "" and not "spf11" in tags:
                tags["spf"].append("spf11")

    # Look up limit check
    dns_lookups = results["spf"].get("dns_lookups", 0)
    if dns_lookups > 10:
        tags["spf"].append("spf12")

    # Check for missing include
    include = results["spf"].get("parsed", {}).get("include", None)
    record = results["spf"].get("record", None)

    if (include is not None) and (record is not None):
        for item in include:
            check_item = item.get("domain", None)
            if check_item is not None and f"include:{check_item}" not in record:
                if not "spf13" in tags:
                    tags["spf"].append("spf13")

    return tags


async def insert_https(report, tags, scan_id, db):

    try:
        await db.connect()
        scan_query = select([Web_scans]).where(Web_scans.c.id == scan_id)
        scan = await db.fetch_one(scan_query)
        logging.info(f"Retrieved corresponding scan from database: {str(scan)}")

        insert_query = Https_scans.insert().values(
            https_scan={"https": report, "tags": tags}, id=scan.get("id")
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


async def insert_ssl(report, tags, scan_id, db):

    try:
        await db.connect()
        scan_query = select([Web_scans]).where(Web_scans.c.id == scan_id)
        scan = await db.fetch_one(scan_query)
        logging.info(f"Retrieved corresponding scan from database: {str(scan)}")

        insert_query = Ssl_scans.insert().values(
            ssl_scan={"ssl": report, "tags": tags}, id=scan.get("id")
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


async def insert_dns(report, tags, scan_id, db):

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
            dmarc_scan={"dmarc": report["dmarc"], "tags": tags["dmarc"]},
            id=scan.get("id"),
        )
        mx_insert_query = Mx_scans.insert().values(
            mx_scan={"mx": report["mx"]}, id=scan.get("id")
        )
        spf_insert_query = Spf_scans.insert().values(
            spf_scan={"spf": report["spf"], "tags": tags["spf"]}, id=scan.get("id")
        )
        dkim_insert_query = Dkim_scans.insert().values(
            dkim_scan={"dkim": report["dkim"], "tags": tags["dkim"]}, id=scan.get("id")
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

            tags = functions["process"][scan_type](results)

            await functions["insert"][scan_type](results, tags, scan_id, async_db)

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
