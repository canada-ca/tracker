"""Update guidance table

Revision ID: dc6adc4d8944
Revises: 5f8c3a21331b
Create Date: 2020-09-24 12:04:03.960057

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY


# revision identifiers, used by Alembic.
revision = 'dc6adc4d8944'
down_revision = '5f8c3a21331b'
branch_labels = None
depends_on = None


def upgrade():
    op.drop_table("classification")
    op.add_column(
        "guidance", sa.Column("tag_id", sa.String()),
    )
    op.alter_column("guidance", "ref_links", type_=ARRAY(sa.String()), postgresql_using='ref_links::character varying[]')


def downgrade():
    op.create_table(
        "classification",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("UNCLASSIFIED", sa.String()),
    )
    op.drop_column("guidance", "tag_id")
    op.alter_column("guidance", "ref_links", type_=sa.String())
