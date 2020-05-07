import pytest
import json
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


s, cleanup, session = DB()


@pytest.fixture
def save():
    with app.app_context():
        yield s
        cleanup()


def test_get_org_resolvers_by_org_super_admin_single_node(save):
    """
    Test org resolver by organization as a super admin, single node return
    """
    org1 = Organizations(
        name="Org1", acronym="ORG1", org_tags={"name": "Organization 1"}
    )
    org2 = Organizations(
        name="Org2", acronym="ORG2", org_tags={"name": "Organization 2"}
    )
    org3 = Organizations(
        name="Org3", acronym="ORG3", org_tags={"name": "Organization 3"}
    )

    reader = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
    )
    super_admin = Users(
        display_name="testsuperadmin",
        user_name="testsuperadmin@testemail.ca",
        password="testpassword123",
    )

    super_admin.user_affiliation.append(
        User_affiliations(permission="super_admin", user_organization=org1)
    )

    reader.user_affiliation.append(
        User_affiliations(permission="user_read", user_organization=org1)
    )

    save(reader)
    save(super_admin)

    token = tokenize(user_id=super_admin.id, roles=super_admin.roles)

    result = Client(schema).execute(
        """
        {
            organization(org: "ORG1") {
                edges {
                    node {
                        acronym
                    }
                }
            }
        }
        """,
        context_value=auth_header(token),
    )
    assert result == {
        "data": {"organization": {"edges": [{"node": {"acronym": "ORG1"}}]}}
    }


def test_org_resolvers_returns_all_orgs_to_super_admin(save):
    """
    Test organization resolver as a super admin, multi node return
    """
    org1 = Organizations(name="Org1", acronym="ORG1")

    reader = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org1)
        ],
    )
    super_admin = Users(
        display_name="testsuperadmin",
        user_name="testsuperadmin@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(permission="super_admin", user_organization=org1)
        ],
    )

    save(reader)
    save(super_admin)

    token = tokenize(user_id=super_admin.id, roles=super_admin.roles)

    result = Client(schema).execute(
        """
        {
            organizations {
                edges {
                    node {
                        name
                    }
                }
            }
        }
        """,
        context_value=auth_header(token),
    )
    assert result == {
        "data": {
            "organizations": {
                "edges": [
                    {"node": {"name": "Org1"}},
                    {"node": {"name": "testsuperadmin@testemail.ca"}},
                    {"node": {"name": "testuserread@testemail.ca"}},
                ]
            }
        }
    }


def test_org_resolvers_returns_single_org1_and_users_own_org_for_read_users(save):
    org1 = Organizations(name="Org1", acronym="ORG1")
    org2 = Organizations(name="SA", acronym="SA")

    reader = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org1)
        ],
    )
    super_admin = Users(
        display_name="testsuperadmin",
        user_name="testsuperadmin@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(permission="super_admin", user_organization=org1),
            User_affiliations(permission="super_admin", user_organization=org2),
        ],
    )

    save(reader)
    save(super_admin)

    token = tokenize(user_id=reader.id, roles=reader.roles)

    result = Client(schema).execute(
        """
        {
            organizations {
                edges {
                    node {
                        name
                    }
                }
            }
        }
        """,
        context_value=auth_header(token),
    )
    assert result == {
        "data": {
            "organizations": {
                "edges": [
                    {"node": {"name": "Org1"}},
                    {"node": {"name": "testuserread@testemail.ca"}},
                ]
            }
        }
    }


def test_org_resolvers_does_not_show_orgs_reader_is_not_affiliated_with(save):
    org1 = Organizations(name="Org1", acronym="ORG1")
    org2 = Organizations(name="Org2", acronym="ORG2")

    reader = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org1)
        ],
    )

    save(reader)

    token = tokenize(user_id=reader.id, roles=reader.roles)

    result = Client(schema).execute(
        """
        {
            organization(org: "ORG2") {
                edges {
                    node {
                        name
                    }
                }
            }
        }
        """,
        context_value=auth_header(token),
    )
    if "errors" not in result:
        fail(
            "Expected read user request for non-affiliated org to error. Instead: {}".format(
                result
            )
        )
    [err] = result["errors"]
    assert err["message"] == "Error, organization does not exist"
