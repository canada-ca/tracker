import sys
import os
from os.path import dirname, join, expanduser, normpath, realpath
from graphene.test import Client
from flask_bcrypt import Bcrypt
from flask import Request
from werkzeug.test import create_environ

import pytest
from unittest import TestCase

# This is the only way I could get imports to work for unit testing.
PACKAGE_PARENT = ".."
SCRIPT_DIR = dirname(realpath(join(os.getcwd(), expanduser(__file__))))
sys.path.append(normpath(join(SCRIPT_DIR, PACKAGE_PARENT)))

from app import app
from db import db_session
from queries import schema
from models import Users, User_affiliations, Organizations
from backend.security_check import SecurityAnalysisBackend


@pytest.fixture(scope="class")
def user_role_test_db_init():
    bcrypt = Bcrypt(app)

    with app.app_context():
        test_user = Users(
            id=1,
            display_name="testuserread",
            user_name="testuserread@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123"
            ).decode("UTF-8"),
        )
        db_session.add(test_user)
        test_user = Users(
            id=2,
            display_name="testuserwrite",
            user_name="testuserwrite@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123"
            ).decode("UTF-8"),
        )
        db_session.add(test_user)
        test_admin = Users(
            id=3,
            display_name="testadmin",
            user_name="testadmin@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123"
            ).decode("UTF-8"),
        )
        db_session.add(test_admin)
        test_super_admin = Users(
            id=4,
            display_name="testsuperadmin",
            user_name="testsuperadmin@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123"
            ).decode("UTF-8"),
        )
        db_session.add(test_super_admin)
        org = Organizations(
            id=1, acronym="ORG1", org_tags={"description": "Organization 1"}
        )
        db_session.add(org)
        test_admin_role = User_affiliations(
            user_id=1, organization_id=1, permission="user_read"
        )
        db_session.add(test_admin_role)
        test_admin_role = User_affiliations(
            user_id=2, organization_id=1, permission="user_write"
        )
        db_session.add(test_admin_role)
        test_admin_role = User_affiliations(
            user_id=3, organization_id=1, permission="admin"
        )
        db_session.add(test_admin_role)
        test_admin_role = User_affiliations(
            user_id=4, organization_id=1, permission="super_admin"
        )
        db_session.add(test_admin_role)
        db_session.commit()

    yield

    with app.app_context():
        User_affiliations.query.delete()
        Organizations.query.delete()
        Users.query.delete()
        db_session.commit()


@pytest.mark.usefixtures("user_role_test_db_init")
class TestUserRole(TestCase):
    def test_user_read_claim(self):
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                """
                mutation{
                    signIn(userName:"testuserread@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                """,
                backend=backend,
            )
            assert get_token["data"]["signIn"]["authToken"] is not None
            token = get_token["data"]["signIn"]["authToken"]
            assert token is not None

            environ = create_environ()
            environ.update(HTTP_AUTHORIZATION=token)
            request_headers = Request(environ)

            executed = client.execute(
                """
                {
                    testUserClaims(org: "ORG1", role: USER_READ)
                }
                """,
                context_value=request_headers,
                backend=backend,
            )
            assert executed["data"]
            assert executed["data"]["testUserClaims"]
            assert executed["data"]["testUserClaims"] == "User Passed User Read Claim"

    def test_user_write_claim(self):
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                """
                mutation{
                    signIn(userName:"testuserwrite@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                """,
                backend=backend,
            )
            assert get_token["data"]["signIn"]["authToken"] is not None
            token = get_token["data"]["signIn"]["authToken"]
            assert token is not None

            environ = create_environ()
            environ.update(HTTP_AUTHORIZATION=token)
            request_headers = Request(environ)

            executed = client.execute(
                """
                {
                    testUserClaims(org: "ORG1", role: USER_WRITE)
                }
                """,
                context_value=request_headers,
                backend=backend,
            )
            assert executed["data"]
            assert executed["data"]["testUserClaims"]
            assert executed["data"]["testUserClaims"] == "User Passed User Write Claim"

    def test_admin_claim(self):
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                """
                mutation{
                    signIn(userName:"testadmin@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                """,
                backend=backend,
            )
            assert get_token["data"]["signIn"]["authToken"] is not None
            token = get_token["data"]["signIn"]["authToken"]
            assert token is not None

            environ = create_environ()
            environ.update(HTTP_AUTHORIZATION=token)
            request_headers = Request(environ)

            executed = client.execute(
                """
                {
                    testUserClaims(org: "ORG1", role: ADMIN)
                }
                """,
                context_value=request_headers,
                backend=backend,
            )
            assert executed["data"]
            assert executed["data"]["testUserClaims"]
            assert executed["data"]["testUserClaims"] == "User Passed Admin Claim"

    def test_super_admin_claim(self):
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                """
                mutation{
                    signIn(userName:"testsuperadmin@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                """,
                backend=backend,
            )
            assert get_token["data"]["signIn"]["authToken"] is not None
            token = get_token["data"]["signIn"]["authToken"]
            assert token is not None

            environ = create_environ()
            environ.update(HTTP_AUTHORIZATION=token)
            request_headers = Request(environ)

            executed = client.execute(
                """
                {
                    testUserClaims(org: "ORG1", role: SUPER_ADMIN)
                }
                """,
                context_value=request_headers,
                backend=backend,
            )
            assert executed["data"]
            assert executed["data"]["testUserClaims"]
            assert executed["data"]["testUserClaims"] == "User Passed Super Admin Claim"

    def test_user_not_admin(self):
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                """
                mutation{
                    signIn(userName:"testuserread@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                """,
                backend=backend,
            )
            assert get_token["data"]["signIn"]["authToken"] is not None
            token = get_token["data"]["signIn"]["authToken"]
            assert token is not None

            environ = create_environ()
            environ.update(HTTP_AUTHORIZATION=token)
            request_headers = Request(environ)

            executed = client.execute(
                """
                {
                    testUserClaims(org: "ORG1", role: ADMIN)
                }
                """,
                context_value=request_headers,
                backend=backend,
            )
            assert executed["errors"]
            assert executed["errors"][0]
            assert (
                executed["errors"][0]["message"]
                == "Error, user is not an admin for that org"
            )
