import os
import csv
import sys
import asyncio
import logging
import databases
import sqlalchemy
from sqlalchemy.sql import select
from sqlalchemy.dialects.postgresql import ARRAY

# config.py containing all database credentials
from config import DB_USER, DB_PASS, DB_HOST, DB_NAME

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

DATABASE_URI = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}"

metadata = sqlalchemy.MetaData()

Domains = sqlalchemy.Table(
    "domains",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("domain", sqlalchemy.String),
    sqlalchemy.Column("last_run", sqlalchemy.DateTime),
    sqlalchemy.Column("selectors", ARRAY(sqlalchemy.String)),
    sqlalchemy.Column("slug", sqlalchemy.String),
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


async def insert():

    # Establish DB connection
    database = databases.Database(DATABASE_URI)
    await database.connect()

    path = os.getcwd()
    files = []
    file_names = os.listdir(path)

    # Iterate through files in current directory to find all .csv files
    for file_name in file_names:
        if file_name.endswith(".csv"):
            files.append(file_name)

    # Iterate through all .csv files
    for i in files:
        file = open(os.path.join(path, i), "rU")
        reader = csv.reader(file, delimiter=',')
        first_row = True
        for row in reader:
            # Skip first row (header)
            if first_row is True:
                first_row = False
                continue

            # First column: Domains
            url = str(row[0])
            # Second column: Organizations
            org = str(row[1])

            # Check if org exists
            org_query = select([Organizations]).where(Organizations.c.name == org)
            org_result = await database.fetch_one(org_query)

            org_exists = (org_result is not None)

            # If not, create the org
            if org_exists is False:
                org_slug = org.replace('.', '-').replace(' ', '-')
                org_acronym = org.upper().replace('.', '-').replace(' ', '-')
                logging.info(f"Org Name: {org}")
                logging.info(f"Org Slug: {org_slug}")
                logging.info(f"Org Acronym: {org_acronym}")
                org_insert = Organizations.insert().values(name=org, slug=org_slug, acronym=org_acronym)
                await database.execute(org_insert)
                org_query = select([Organizations]).where(Organizations.c.name == org)
                org_result = await database.fetch_one(org_query)

            # Check if the domain exists
            domain_query = select([Domains]).where(Domains.c.domain == url)
            domain_result = await database.fetch_one(domain_query)

            domain_exists = (domain_result is not None)

            # If not, create the domain
            if domain_exists is False:
                domain_slug = url.replace(".", "-").replace(' ', '-')
                logging.info(f"Domain Name: {url}")
                logging.info(f"Domain Slug: {domain_slug}")
                domain_insert = Domains.insert().values(domain=url, slug=domain_slug, organization_id=org_result.get("id"))
                await database.execute(domain_insert)

    await database.disconnect()


if __name__ == "__main__":
    asyncio.run(insert())
