import pytest
import json

from pytest import fail
from flask import Request
from json_web_token import tokenize, auth_header
from graphene.test import Client
from unittest import TestCase
from werkzeug.test import create_environ
from app import app
from db import DB
from models import Organizations, Users, User_affiliations
from queries import schema
from backend.security_check import SecurityAnalysisBackend


s, cleanup, db_session = DB()


@pytest.fixture
def save():
    with app.app_context():
        yield s
        cleanup()


def test_get_users_as_super_admin(save):
    """
    Test to see if users resolver access control allows super admin to
    request users outside of organization
    """
    org1 = Organizations(acronym="ORG1", name="Organization 1")
    org2 = Organizations(acronym="ORG2", name="Organization 2")
    org3 = Organizations(acronym="ORG3", name="Organization 3")

    reader = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org1, permission="user_read")
        ],
    )
    super_admin = Users(
        display_name="testsuperadmin",
        user_name="testsuperadmin@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org2, permission="super_admin")
        ],
    )
    org1_admin = Users(
        display_name="testadmin",
        user_name="testadmin@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org1, permission="admin")
        ],
    )
    org2_admin = Users(
        display_name="testadmin2",
        user_name="testadmin2@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org2, permission="admin")
        ],
    )
    writer = Users(
        display_name="testuserwrite",
        user_name="testuserwrite@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org1, permission="user_write")
        ],
    )
    save(reader)
    save(super_admin)
    save(org1_admin)
    save(org2_admin)
    save(writer)

    actual = Client(schema).execute(
        """
        {
            users(orgSlug: "organization-1") {
                edges {
                    node {
                        displayName
                    }
                }
            }
        }
        """,
        context_value=auth_header(
            tokenize(user_id=super_admin.id, roles=super_admin.roles)
        ),
    )
    expected = {
        "data": {
            "users": {
                "edges": [
                    {"node": {"displayName": "testuserread"}},
                    {"node": {"displayName": "testadmin"}},
                    {"node": {"displayName": "testuserwrite"}},
                ]
            }
        }
    }
    assert expected == actual


# Admin Same Org
def test_get_users_from_same_org(save):
    """
    Test users query to see if an admin from the corresponding org can
    retrieve the information
    """
    org1 = Organizations(acronym="ORG1", name="Organization 1")
    org2 = Organizations(acronym="ORG2", name="Organization 2")
    org3 = Organizations(acronym="ORG3", name="Organization 3")

    reader = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org1, permission="user_read")
        ],
    )
    super_admin = Users(
        display_name="testsuperadmin",
        user_name="testsuperadmin@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org2, permission="super_admin")
        ],
    )
    org1_admin = Users(
        display_name="testadmin",
        user_name="testadmin@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org1, permission="admin")
        ],
    )
    org2_admin = Users(
        display_name="testadmin2",
        user_name="testadmin2@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org2, permission="admin")
        ],
    )
    writer = Users(
        display_name="testuserwrite",
        user_name="testuserwrite@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org1, permission="user_write")
        ],
    )
    save(reader)
    save(super_admin)
    save(org1_admin)
    save(org2_admin)
    save(writer)

    actual = Client(schema).execute(
        """
        {
            users(orgSlug: "organization-1") {
                edges {
                    node {
                        displayName
                    }
                }
            }
        }
        """,
        context_value=auth_header(
            tokenize(user_id=org1_admin.id, roles=org1_admin.roles)
        ),
    )
    expected = {
        "data": {
            "users": {
                "edges": [
                    {"node": {"displayName": "testuserread"}},
                    {"node": {"displayName": "testadmin"}},
                    {"node": {"displayName": "testuserwrite"}},
                ]
            }
        }
    }

    assert actual == expected


# Admin different org
def test_get_users_admin_from_different_org(save):
    """
    Test users query to see if an admin from anther org cannot
    retrieve the information
    """
    org1 = Organizations(acronym="ORG1", name="Organization 1")
    org2 = Organizations(acronym="ORG2", name="Organization 2")
    org3 = Organizations(acronym="ORG3", name="Organization 3")

    reader = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org1, permission="user_read")
        ],
    )
    super_admin = Users(
        display_name="testsuperadmin",
        user_name="testsuperadmin@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org2, permission="super_admin")
        ],
    )
    org1_admin = Users(
        display_name="testadmin",
        user_name="testadmin@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org1, permission="admin")
        ],
    )
    org2_admin = Users(
        display_name="testadmin2",
        user_name="testadmin2@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org2, permission="admin")
        ],
    )
    writer = Users(
        display_name="testuserwrite",
        user_name="testuserwrite@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org1, permission="user_write")
        ],
    )
    save(reader)
    save(super_admin)
    save(org1_admin)
    save(org2_admin)
    save(writer)

    actual = Client(schema).execute(
        """
        {
            users(orgSlug: "organization-1") {
                edges {
                    node {
                        displayName
                    }
                }
            }
        }
        """,
        context_value=auth_header(
            tokenize(user_id=org2_admin.id, roles=org2_admin.roles)
        ),
    )
    if "errors" not in actual:
        fail(
            "Expected admins in other orgs access to raise and error. Instead:"
            "{}".format(json(actual))
        )
    [err] = actual["errors"]
    [message, _, _] = err.values()
    assert message == "Error, you do not have access to view this organization"


# User write tests
def test_get_users_user_write(save):
    """
    Ensure user write cannot access this query
    """
    org1 = Organizations(acronym="ORG1", name="Organization 1")
    org2 = Organizations(acronym="ORG2", name="Organization 2")
    org3 = Organizations(acronym="ORG3", name="Organization 3")

    reader = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org1, permission="user_read")
        ],
    )
    super_admin = Users(
        display_name="testsuperadmin",
        user_name="testsuperadmin@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org2, permission="super_admin")
        ],
    )
    org1_admin = Users(
        display_name="testadmin",
        user_name="testadmin@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org1, permission="admin")
        ],
    )
    org2_admin = Users(
        display_name="testadmin2",
        user_name="testadmin2@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org2, permission="admin")
        ],
    )
    writer = Users(
        display_name="testuserwrite",
        user_name="testuserwrite@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org1, permission="user_write")
        ],
    )
    save(reader)
    save(super_admin)
    save(org1_admin)
    save(org2_admin)
    save(writer)

    actual = Client(schema).execute(
        """
        {
            users(orgSlug: "organization-1") {
                edges {
                    node {
                        displayName
                    }
                }
            }
        }
        """,
        context_value=auth_header(
            tokenize(user_id=writer.id, roles=writer.roles)
        ),
    )
    if "errors" not in actual:
        fail(
            "Expected write user not to access this query. Instead:"
            "{}".format(json(actual))
        )
    [err] = actual["errors"]
    [message, _, _] = err.values()
    assert message == "Error, you do not have access to view this organization"


def test_get_users_user_read(save):
    """
    Ensure user write cannot access this query
    """
    org1 = Organizations(acronym="ORG1", name="Organization 1")
    org2 = Organizations(acronym="ORG2", name="Organization 2")
    org3 = Organizations(acronym="ORG3", name="Organization 3")

    reader = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org1, permission="user_read")
        ],
    )
    super_admin = Users(
        display_name="testsuperadmin",
        user_name="testsuperadmin@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org2, permission="super_admin")
        ],
    )
    org1_admin = Users(
        display_name="testadmin",
        user_name="testadmin@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org1, permission="admin")
        ],
    )
    org2_admin = Users(
        display_name="testadmin2",
        user_name="testadmin2@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org2, permission="admin")
        ],
    )
    writer = Users(
        display_name="testuserwrite",
        user_name="testuserwrite@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org1, permission="user_write")
        ],
    )
    save(reader)
    save(super_admin)
    save(org1_admin)
    save(org2_admin)
    save(writer)

    actual = Client(schema).execute(
        """
        {
            users(orgSlug: "organization-1") {
                edges {
                    node {
                        displayName
                    }
                }
            }
        }
        """,
        context_value=auth_header(
            tokenize(user_id=reader.id, roles=reader.roles)
        ),
    )
    if "errors" not in actual:
        fail(
            "Expected read user not to access this query. Instead:"
            "{}".format(json(actual))
        )
    [err] = actual["errors"]
    [message, _, _] = err.values()
    assert message == "Error, you do not have access to view this organization"

