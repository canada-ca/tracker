"""empty message

Revision ID: 5f8c3a21331b
Revises: bdb0ec9f761c
Create Date: 2020-07-06 07:29:09.063983

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "5f8c3a21331b"
down_revision = "bdb0ec9f761c"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_table("dmarc_reports")
    op.add_column(
        "domains", sa.Column("slug", sa.String(), index=True),
    )


def downgrade():
    op.create_table(
        "dmarc_reports",
        sa.Column("id", sa.INTEGER(), autoincrement=True, nullable=False),
        sa.Column(
            "start_date", postgresql.TIMESTAMP(), autoincrement=False, nullable=True
        ),
        sa.Column(
            "end_date", postgresql.TIMESTAMP(), autoincrement=False, nullable=True
        ),
        sa.Column(
            "report",
            postgresql.JSONB(astext_type=sa.Text()),
            autoincrement=False,
            nullable=True,
        ),
        sa.Column("domain_id", sa.INTEGER(), autoincrement=False, nullable=True),
        sa.ForeignKeyConstraint(
            ["domain_id"], ["domains.id"], name="dmarc_reports_domain_id_fkey"
        ),
        sa.PrimaryKeyConstraint("id", name="dmarc_reports_pkey"),
    )
    op.drop_column("domains", "slug")
