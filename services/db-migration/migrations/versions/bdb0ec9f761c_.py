"""empty message

Revision ID: bdb0ec9f761c
Revises: 357ddd27f2d7
Create Date: 2020-07-06 06:57:37.015218

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "bdb0ec9f761c"
down_revision = "357ddd27f2d7"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "users",
        sa.Column("email_validated", sa.Boolean(), nullable=True, default=False),
    )


def downgrade():
    op.drop_column("users", "email_validated")
