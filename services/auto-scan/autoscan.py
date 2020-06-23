import os
import sys
import asyncio
import logging
import requests
import datetime
import databases
import sqlalchemy
import bcrypt
from sqlalchemy.sql import select
from sqlalchemy.dialects.postgresql import ARRAY

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_HOST = os.getenv("DB_HOST")
SYSTEM_USER = os.getenv("SYSTEM_USER")
SYSTEM_PASS = os.getenv("SYSTEM_PASS")

DATABASE_URI = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
DISPATCHER_URL = "http://dispatcher.tracker.svc.cluster.local"

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

Classification = sqlalchemy.Table(
    "classification",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("UNCLASSIFIED", sqlalchemy.String),
)


def Service(database=databases.Database(DATABASE_URI), client=requests):

    async def dispatch_web(domain, scan_id):

        payload = {
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=0, seconds=10),
            "scan_id": scan_id,
            "domain": domain,
            "selectors": domain.get("selectors"),
            "user_init": True,
        }
        headers = {
            "Content-Type": "application/json",
            "Data": str(payload),
            "Scan-Type": "web",
        }
        client.post(DISPATCHER_URL + "/receive", headers=headers)

    async def dispatch_mail(domain, scan_id):

        payload = {
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=0, seconds=10),
            "scan_id": scan_id,
            "domain": domain,
            "selectors": domain.get("selectors"),
            "user_init": True,
        }
        headers = {
            "Content-Type": "application/json",
            "Data": str(payload),
            "Scan-Type": "mail",
        }
        client.post(DISPATCHER_URL + "/receive", headers=headers)

    async def main():
        logging.info("Retrieving domains for scheduled scan...")
        try:
            await database.connect()
            logging.info("Querying domains...")

            query = select([Domains])
            domains = await database.fetch_all(query)
            dispatched = []

            system_user_query = select([Users]).where(Users.c.user_name == "system")
            system = await database.fetch_one(system_user_query)

            scan_time = datetime.datetime.utcnow()

            for domain in domains:
                web_insert = Web_scans.insert().values(
                    domain_id=domain.get("id"),
                    scan_date=scan_time,
                    initiated_by=system.get("id"),
                )
                mail_insert = Mail_scans.insert().values(
                    domain_id=domain.get("id"),
                    scan_date=scan_time,
                    selectors=domain.get("selectors"),
                    initiated_by=system.get("id"),
                )

                update_domain = Domains.update().values(last_run=scan_time).where(Domains.c.id == domain.get("id"))

                for insertion in [web_insert, mail_insert, update_domain]:
                    await database.execute(insertion)

                mail_scan_query = select([Mail_scans]).order_by(Mail_scans.c.id.desc())
                mail_scan = await database.fetch_one(mail_scan_query)
                web_scan_query = select([Web_scans]).order_by(Web_scans.c.id.desc())
                web_scan = await database.fetch_one(web_scan_query)

                dispatched.append(dispatch_web(domain, web_scan.get("id")))
                dispatched.append(dispatch_mail(domain, mail_scan.get("id")))

            for domain in dispatched:
                await domain

            await database.disconnect()
            return {"Dispatched": [domain.get('domain') for domain in domains]}

        except Exception as e:
            try:
                await database.disconnect()
            except:
                pass
            logging.error(e)
            return {"Dispatched": []}

    return asyncio.run(main())


if __name__ == "__main__":
    logging.info(Service())
