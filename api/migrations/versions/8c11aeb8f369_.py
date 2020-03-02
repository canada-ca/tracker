"""empty message

Revision ID: 8c11aeb8f369
Revises: d71a446b0f6f
Create Date: 2020-03-02 10:38:24.644726

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8c11aeb8f369'
down_revision = 'd71a446b0f6f'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('users', 'failed_login_attempt_time')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('users', sa.Column('failed_login_attempt_time', sa.VARCHAR(), autoincrement=False, nullable=True))
    # ### end Alembic commands ###
