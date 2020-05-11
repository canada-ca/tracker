from graphene.test import Client
from flask import Request
from werkzeug.test import create_environ
import pytest
from unittest import TestCase
from app import app
from db import DB
from queries import schema
from models import Users, User_affiliations, Organizations
from functions.error_messages import error_not_an_admin
from backend.security_check import SecurityAnalysisBackend

_, cleanup, db_session = DB()


@pytest.fixture
def save():
    with app.app_context():
        org1 = Organizations(acronym="ORG1")
        test_user = Users(
            display_name="testuserread",
            user_name="testuserread@testemail.ca",
            password="testpassword123",
            user_affiliation=[
                User_affiliations(user_organization=org1, permission="user_read")
            ],
        )

        test_super_admin = Users(
            display_name="testsuperadmin",
            user_name="testsuperadmin@testemail.ca",
            password="testpassword123",
            user_affiliation=[
                User_affiliations(user_organization=org1, permission="super_admin")
            ],
        )
        db_session.add(test_user)
        db_session.add(test_super_admin)
        db_session.commit()

        yield
        cleanup()


def test_user_claim_update_to_user_write(save):
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
        mutation{
            updateUserRole(org: "ORG1", role: USER_WRITE, userName:"testuserread@testemail.ca"){
                status
            }
        }
        """,
        context_value=request_headers,
        backend=backend,
    )
    assert executed["data"]
    assert executed["data"]["updateUserRole"]
    assert executed["data"]["updateUserRole"]["status"] == "Update Successful"

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
            testUserClaims(org: "ORG1", role: USER_WRITE)
        }
        """,
        context_value=request_headers,
        backend=backend,
    )
    assert executed["data"]
    assert executed["data"]["testUserClaims"]
    assert executed["data"]["testUserClaims"] == "User Passed User Write Claim"


def test_user_claim_update_to_admin(save):
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
        mutation{
            updateUserRole(org: "ORG1", role: ADMIN, userName:"testuserread@testemail.ca"){
                status
            }
        }
        """,
        context_value=request_headers,
        backend=backend,
    )
    assert executed["data"]
    assert executed["data"]["updateUserRole"]
    assert executed["data"]["updateUserRole"]["status"] == "Update Successful"

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
    assert executed["data"]
    assert executed["data"]["testUserClaims"]
    assert executed["data"]["testUserClaims"] == "User Passed Admin Claim"


def test_user_claim_update_to_super_admin(save):
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
            mutation{
                updateUserRole(org: "ORG1", role: SUPER_ADMIN, userName:"testuserread@testemail.ca"){
                    status
                }
            }
            """,
            context_value=request_headers,
            backend=backend,
        )
        assert executed["data"]
        assert executed["data"]["updateUserRole"]
        assert executed["data"]["updateUserRole"]["status"] == "Update Successful"

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
                testUserClaims(org: "ORG1", role: SUPER_ADMIN)
            }
            """,
            context_value=request_headers,
            backend=backend,
        )
        assert executed["data"]
        assert executed["data"]["testUserClaims"]
        assert executed["data"]["testUserClaims"] == "User Passed Super Admin Claim"


def test_user_claim_update_to_user_write(save):
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
        mutation{
            updateUserRole(org: "ORG1", role: ADMIN, userName:"testsuperadmin@testemail.ca"){
                status
            }
        }
        """,
        context_value=request_headers,
        backend=backend,
    )
    assert executed["errors"]
    assert executed["errors"][0]
    assert executed["errors"][0]["message"] == error_not_an_admin()
