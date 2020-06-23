"""Initial revision

Revision ID: 641d69cc2685
Revises: 
Create Date: 2020-06-18 12:11:25.148841

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '641d69cc2685'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "organizations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String()),
        sa.Column("slug", sa.String(), index=True),
        sa.Column("acronym", sa.String()),
        sa.Column("org_tags", sa.JSON()),
    )
    op.create_table(
        "domains",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("domain", sa.String()),
        sa.Column("last_run", sa.DateTime()),
        sa.Column("selectors", sa.ARRAY(sa.String())),
        sa.Column("organization_id", sa.Integer(), sa.ForeignKey("organizations.id")),
    )
    op.create_table(
        "dmarc_reports",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("domain_id", sa.Integer(), sa.ForeignKey("domains.id")),
        sa.Column("start_date", sa.DateTime()),
        sa.Column("end_date", sa.DateTime()),
        sa.Column("report", sa.JSON()),
    )
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_name", sa.String()),
        sa.Column("display_name", sa.String()),
        sa.Column("user_password", sa.String()),
        sa.Column("preferred_lang", sa.String()),
        sa.Column("failed_login_attempts", sa.Integer(), default=0),
        sa.Column(
            "failed_login_attempt_time", sa.Float(), default=0, nullable=True
        ),
        sa.Column("tfa_validated", sa.Boolean(), default=False),
    )
    op.create_table(
        "user_affiliations",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey(
                "users.id",
                onupdate="CASCADE",
                ondelete="CASCADE",
                name="user_affiliations_users_id_fkey",
            ),
            primary_key=True,
        ),
        sa.Column(
            "organization_id",
            sa.Integer(),
            sa.ForeignKey(
                "organizations.id",
                onupdate="CASCADE",
                ondelete="CASCADE",
                name="user_affiliations_organization_id_fkey",
            ),
        ),
        sa.Column("permission", sa.String()),
    )
    op.create_table(
        "web_scans",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "domain_id", sa.Integer(), sa.ForeignKey("domains.id")
        ),
        sa.Column("scan_date", sa.DateTime()),
        sa.Column(
            "initiated_by", sa.Integer(), sa.ForeignKey("users.id")
        ),
    )
    op.create_table(
        "mail_scans",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "domain_id", sa.Integer(), sa.ForeignKey("domains.id")
        ),
        sa.Column("scan_date", sa.DateTime()),
        sa.Column("selectors", sa.ARRAY(sa.String())),
        sa.Column("dmarc_phase", sa.Integer()),
        sa.Column(
            "initiated_by", sa.Integer(), sa.ForeignKey("users.id")
        ),
    )
    op.create_table(
        "dmarc_scans",
        sa.Column(
            "id",
            sa.Integer(),
            sa.ForeignKey("mail_scans.id"),
            primary_key=True,
        ),
        sa.Column("dmarc_scan", sa.JSON()),
    )
    op.create_table(
        "dkim_scans",
        sa.Column(
            "id",
            sa.Integer(),
            sa.ForeignKey("mail_scans.id"),
            primary_key=True,
        ),
        sa.Column("dkim_scan", sa.JSON()),
    )
    op.create_table(
        "mx_scans",
        sa.Column(
            "id",
            sa.Integer(),
            sa.ForeignKey("mail_scans.id"),
            primary_key=True,
        ),
        sa.Column("mx_scan", sa.JSON()),
    )
    op.create_table(
        "spf_scans",
        sa.Column(
            "id",
            sa.Integer(),
            sa.ForeignKey("mail_scans.id"),
            primary_key=True,
        ),
        sa.Column("spf_scan", sa.JSON()),
    )
    op.create_table(
        "https_scans",
        sa.Column(
            "id",
            sa.Integer(),
            sa.ForeignKey("web_scans.id"),
            primary_key=True,
        ),
        sa.Column("https_scan", sa.JSON()),
    )
    op.create_table(
        "ssl_scans",
        sa.Column(
            "id",
            sa.Integer(),
            sa.ForeignKey("web_scans.id"),
            primary_key=True,
        ),
        sa.Column("ssl_scan", sa.JSON()),
    )
    op.create_table(
        "ciphers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("cipher_type", sa.String()),
    )
    op.create_table(
        "guidance",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("tag_name", sa.String()),
        sa.Column("guidance", sa.String()),
        sa.Column("ref_links", sa.String()),
    )
    op.create_table(
        "classification",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("UNCLASSIFIED", sa.String()),
    )


def downgrade():
    op.drop_table("classification")
    op.drop_table("guidance")
    op.drop_table("ciphers")
    op.drop_table("ssl_scans")
    op.drop_table("https_scans")
    op.drop_table("spf_scans")
    op.drop_table("mx_scans")
    op.drop_table("dkim_scans")
    op.drop_table("dmarc_scans")
    op.drop_table("mail_scans")
    op.drop_table("web_scans")
    op.drop_table("user_affiliations")
    op.drop_table("users")
    op.drop_table("dmarc_reports")
    op.drop_table("domains")
    op.drop_table("organizations")
