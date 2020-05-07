"""empty message

Revision ID: 1860746a39e4
Revises: cf42b66dbc12
Create Date: 2020-04-30 22:30:22.681303

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.schema import Sequence, CreateSequence


# revision identifiers, used by Alembic.
revision = "1860746a39e4"
down_revision = "cf42b66dbc12"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(CreateSequence(Sequence("dmarc_reports_id_seq")))
    op.execute(
        "ALTER TABLE dmarc_reports ALTER COLUMN id SET DEFAULT nextval('public.dmarc_reports_id_seq')"
    )
    op.execute("ALTER SEQUENCE dmarc_reports_id_seq OWNED BY dmarc_reports.id")


def downgrade():
    op.execute("ALTER TABLE dmarc_reports ALTER COLUMN id DROP DEFAULT")
    op.execute("DROP SEQUENCE dmarc_reports_id_seq")
