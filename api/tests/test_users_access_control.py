import pytest

from pytest import fail

from app import app
from db import DB
from models import Organizations, Users, User_affiliations
from tests.test_functions import json, run


@pytest.fixture
def save():
    with app.app_context():
        s, cleanup, db_session = DB()
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

    actual = run(
        query="""
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
        as_user=super_admin
    )

    if "errors" in actual:
        fail(
            "Tried to get users from org as super admin, instead: {}".format(
                json(actual)
            )
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

    actual = run(
        query="""
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
        as_user=org1_admin
    )

    if "errors" in actual:
        fail(
            "Tried to get users from org as org admin, instead: {}".format(
                json(actual)
            )
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

    actual = run(
        query="""
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
        as_user=org2_admin,
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

    actual = run(
        query="""
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
        as_user=writer,
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

    actual = run(
        query="""
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
        as_user=reader,
    )

    if "errors" not in actual:
        fail(
            "Expected read user not to access this query. Instead:"
            "{}".format(json(actual))
        )

    [err] = actual["errors"]
    [message, _, _] = err.values()
    assert message == "Error, you do not have access to view this organization"
