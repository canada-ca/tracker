"""empty message

Revision ID: 357ddd27f2d7
Revises: 641d69cc2685
Create Date: 2020-07-03 07:29:40.789272

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "357ddd27f2d7"
down_revision = "641d69cc2685"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "summaries",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String()),
        sa.Column("count", sa.Integer()),
        sa.Column("percentage", sa.Float()),
        sa.Column("type", sa.String()),
    )


def downgrade():
    op.drop_table("summaries")
