import sqlalchemy
from sqlalchemy.dialects.postgresql import ARRAY

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
    sqlalchemy.Column("email_validated", sqlalchemy.Boolean, default=False),
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

Summaries = sqlalchemy.Table(
    "summaries",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("name", sqlalchemy.String),
    sqlalchemy.Column("count", sqlalchemy.Integer),
    sqlalchemy.Column("percentage", sqlalchemy.Float),
    sqlalchemy.Column("type", sqlalchemy.String),
)
