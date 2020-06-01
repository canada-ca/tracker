import pytest
from pytest import fail

from db import DB
from models import Organizations, Users, User_affiliations
from tests.test_functions import json, run


@pytest.fixture
def save():
    s, cleanup, db_session = DB()
    yield s
    cleanup()


def test_get_users_as_super_admin(save):
    """
    Test to see if users resolver will return all information to super admin
    """
    org1 = Organizations(acronym="ORG1", name="Organization 1")
    org2 = Organizations(acronym="ORG2", name="Organization 2")

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
    save(writer)

    actual = run(
        query="""
        {
            users(orgSlug: "organization-1") {
                edges {
                    node {
                        userName
                        displayName
                        permission
                    }
                }
            }
        }
        """,
        as_user=super_admin,
    )

    if "errors" in actual:
        fail("Expected query to succeed. Instead:" "{}".format(json(actual)))

    expected = {
        "data": {
            "users": {
                "edges": [
                    {
                        "node": {
                            "userName": "testuserread@testemail.ca",
                            "displayName": "testuserread",
                            "permission": "USER_READ",
                        }
                    },
                    {
                        "node": {
                            "userName": "testadmin@testemail.ca",
                            "displayName": "testadmin",
                            "permission": "ADMIN",
                        }
                    },
                    {
                        "node": {
                            "userName": "testuserwrite@testemail.ca",
                            "displayName": "testuserwrite",
                            "permission": "USER_WRITE",
                        }
                    },
                ]
            }
        }
    }

    assert actual == expected


def test_get_users_as_admin(save):
    """
    Test to see if users resolver will return all information to org admin
    """
    org1 = Organizations(acronym="ORG1", name="Organization 1")
    org2 = Organizations(acronym="ORG2", name="Organization 2")

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
    save(writer)

    actual = run(
        query="""
        {
            users(orgSlug: "organization-1") {
                edges {
                    node {
                        userName
                        displayName
                        permission
                    }
                }
            }
        }
        """,
        as_user=org1_admin,
    )

    if "errors" in actual:
        fail(
            "Tried to get user info from org as org admin, instead: {}".format(
                json(actual)
            )
        )

    expected = {
        "data": {
            "users": {
                "edges": [
                    {
                        "node": {
                            "userName": "testuserread@testemail.ca",
                            "displayName": "testuserread",
                            "permission": "USER_READ",
                        }
                    },
                    {
                        "node": {
                            "userName": "testadmin@testemail.ca",
                            "displayName": "testadmin",
                            "permission": "ADMIN",
                        }
                    },
                    {
                        "node": {
                            "userName": "testuserwrite@testemail.ca",
                            "displayName": "testuserwrite",
                            "permission": "USER_WRITE",
                        }
                    },
                ]
            }
        }
    }
    assert actual == expected
