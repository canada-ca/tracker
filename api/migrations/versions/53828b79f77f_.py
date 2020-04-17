"""empty message

Revision ID: 53828b79f77f
Revises: cf42b66dbc12
Create Date: 2020-04-17 11:43:43.244146

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column
from sqlalchemy import String, Integer, Boolean, Float, JSON


# revision identifiers, used by Alembic.
revision = '53828b79f77f'
down_revision = 'cf42b66dbc12'
branch_labels = None
depends_on = None


def upgrade():
    users_table = table(
        'users',
        column('id', Integer),
        column('display_name', String),
        column('user_password', String),
        column('preferred_lang', String),
        column('failed_login_attempts', Integer),
        column('tfa_validated', Boolean),
        column('user_name', String),
        column('failed_login_attempt_time', Float)
    )
    op.bulk_insert(
        users_table,
        [
            {
                'id': 1,
                'display_name': 'testsuperadmin',
                'user_password': '$2b$12$vXlvwc80mGCrxULUKTEbmOrZR9tafrDUVOujO6i2RAEeWmLMm.s8S',
                'preferred_lang': 'English',
                'failed_login_attempts': 0,
                'tfa_validated': False,
                'user_name': 'testsuperadmin@testemail.ca',
                'failed_login_attempt_time': 0
            }
        ]
    )

    org_table = table(
        'organizations',
        column('id', Integer),
        column('org_tags', JSON),
        column('acronym', String)
    )
    op.bulk_insert(
        org_table,
        [
            {
                'id': 1,
                'org_tags': {
                    'Description': 'Super Admin Org'
                },
                'acronym': 'SA'
            }
        ]
    )

    user_aff_table = table(
        'user_affiliations',
        column('id', Integer),
        column('organization_id', Integer),
        column('permission', String),
        column('user_id', Integer)
    )

    op.bulk_insert(
        user_aff_table,
        [
            {
                'id': 1,
                'organization_id': 1,
                'permission': 'super_admin',
                'user_id': 1
            }
        ]
    )


def downgrade():
    op.execute('truncate table user_affiliations CASCADE')
    op.execute('truncate table organizations CASCADE')
    op.execute('truncate table users CASCADE')
