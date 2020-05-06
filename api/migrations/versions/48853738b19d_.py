"""empty message

Revision ID: 48853738b19d
Revises: 8c11aeb8f369
Create Date: 2020-03-02 10:38:54.493855

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "48853738b19d"
down_revision = "8c11aeb8f369"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column(
        "users", sa.Column("failed_login_attempt_time", sa.Float(), nullable=True)
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column("users", "failed_login_attempt_time")
    # ### end Alembic commands ###
