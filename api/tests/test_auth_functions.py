import sys
import os
from os.path import dirname, join, expanduser, normpath, realpath
from flask_bcrypt import Bcrypt

import pytest

# This is the only way I could get imports to work for unit testing.
PACKAGE_PARENT = '..'
SCRIPT_DIR = dirname(realpath(join(os.getcwd(), expanduser(__file__))))
sys.path.append(normpath(join(SCRIPT_DIR, PACKAGE_PARENT)))

from app import app
from db import db_session
from models import Users, User_affiliations, Organizations
from functions.auth_functions import (
    is_super_admin,
    is_admin,
    is_user_write,
    is_user_read
)


@pytest.fixture(scope='class')
def user_role_test_db_init():
    bcrypt = Bcrypt(app)

    with app.app_context():
        test_user = Users(
            id=1,
            display_name="testuserread",
            user_name="testuserread@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123").decode("UTF-8"),
        )
        db_session.add(test_user)
        test_user = Users(
            id=2,
            display_name="testuserwrite",
            user_name="testuserwrite@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123").decode("UTF-8"),
        )
        db_session.add(test_user)
        test_admin = Users(
            id=3,
            display_name="testadmin",
            user_name="testadmin@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123").decode("UTF-8")
        )
        db_session.add(test_admin)
        test_super_admin = Users(
            id=4,
            display_name="testsuperadmin",
            user_name="testsuperadmin@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123").decode("UTF-8")
        )
        db_session.add(test_super_admin)
        org = Organizations(
            id=1,
            acronym='ORG1',
            org_tags={
                "description": 'Organization 1'
            }
        )
        db_session.add(org)
        test_admin_role = User_affiliations(
            user_id=1,
            organization_id=1,
            permission='user_read'
        )
        db_session.add(test_admin_role)
        test_admin_role = User_affiliations(
            user_id=2,
            organization_id=1,
            permission='user_write'
        )
        db_session.add(test_admin_role)
        test_admin_role = User_affiliations(
            user_id=3,
            organization_id=1,
            permission='admin'
        )
        db_session.add(test_admin_role)
        test_admin_role = User_affiliations(
            user_id=4,
            organization_id=1,
            permission='super_admin'
        )
        db_session.add(test_admin_role)
        db_session.commit()

    yield

    with app.app_context():
        User_affiliations.query.delete()
        Organizations.query.delete()
        Users.query.delete()
        db_session.commit()


@pytest.mark.usefixtures('user_role_test_db_init')
class TestAuthFunctions:
    def test_user_read_check_perm_user_read(self):
        user_role = [{'user_id': 1, 'org_id': 1, 'permission': 'user_read'}]
        org_id = 1
        assert is_user_read(user_role, org_id)

    def test_user_read_check_perm_user_write(self):
        user_role = [{'user_id': 2, 'org_id': 1, 'permission': 'user_write'}]
        org_id = 1
        assert is_user_read(user_role, org_id)

    def test_user_read_check_perm_user_admin(self):
        user_role = [{'user_id': 3, 'org_id': 1, 'permission': 'admin'}]
        org_id = 1
        assert is_user_read(user_role, org_id)

    def test_user_read_check_perm_super_admin(self):
        user_role = [{'user_id': 4, 'org_id': 1, 'permission': 'super_admin'}]
        org_id = 1
        assert is_user_read(user_role, org_id)

    def test_user_read_check_invalid(self):
        user_role = [{'user_id': 1, 'org_id': 1, 'permission': ''}]
        org_id = 1
        assert not is_user_read(user_role, org_id)

    def test_user_write_check_perm_user_read(self):
        user_role = [{'user_id': 1, 'org_id': 1, 'permission': 'user_read'}]
        org_id = 1
        assert not is_user_write(user_role, org_id)

    def test_user_write_check_perm_user_write(self):
        user_role = [{'user_id': 2, 'org_id': 1, 'permission': 'user_write'}]
        org_id = 1
        assert is_user_write(user_role, org_id)

    def test_user_write_check_perm_user_admin(self):
        user_role = [{'user_id': 3, 'org_id': 1, 'permission': 'admin'}]
        org_id = 1
        assert is_user_write(user_role, org_id)

    def test_user_write_check_perm_super_admin(self):
        user_role = [{'user_id': 4, 'org_id': 1, 'permission': 'super_admin'}]
        org_id = 1
        assert is_user_write(user_role, org_id)

    def test_user_write_check_invalid(self):
        user_role = [{'user_id': 1, 'org_id': 1, 'permission': ''}]
        org_id = 1
        assert not is_user_write(user_role, org_id)

    def test_admin_check_perm_user_read(self):
        user_role = [{'user_id': 1, 'org_id': 1, 'permission': 'user_read'}]
        org_id = 1
        assert not is_admin(user_role, org_id)

    def test_admin_check_perm_user_write(self):
        user_role = [{'user_id': 2, 'org_id': 1, 'permission': 'user_write'}]
        org_id = 1
        assert not is_admin(user_role, org_id)

    def test_admin_check_perm_user_admin(self):
        user_role = [{'user_id': 3, 'org_id': 1, 'permission': 'admin'}]
        org_id = 1
        assert is_admin(user_role, org_id)

    def test_admin_check_perm_super_admin(self):
        user_role = [{'user_id': 4, 'org_id': 1, 'permission': 'super_admin'}]
        org_id = 1
        assert is_admin(user_role, org_id)

    def test_admin_check_invalid(self):
        user_role = [{'user_id': 1, 'org_id': 1, 'permission': ''}]
        org_id = 1
        assert not is_admin(user_role, org_id)

    def test_super_admin_check_perm_user_read(self):
        user_role = [{'user_id': 1, 'org_id': 1, 'permission': 'user_read'}]
        assert not is_super_admin(user_role)

    def test_super_admin_check_perm_user_write(self):
        user_role = [{'user_id': 2, 'org_id': 1, 'permission': 'user_write'}]
        assert not is_super_admin(user_role)

    def test_super_admin_check_perm_user_admin(self):
        user_role = [{'user_id': 3, 'org_id': 1, 'permission': 'admin'}]
        assert not is_super_admin(user_role)

    def test_super_admin_check_perm_super_admin(self):
        user_role = [{'user_id': 4, 'org_id': 1, 'permission': 'super_admin'}]
        assert is_super_admin(user_role)

    def test_super_admin_check_invalid(self):
        user_role = [{'user_id': 1, 'org_id': 1, 'permission': ''}]
        assert not is_super_admin(user_role)
