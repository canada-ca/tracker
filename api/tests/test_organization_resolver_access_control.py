import logging
import pytest

from pytest import fail

from db import DB
from models import Organizations, Users, User_affiliations
from tests.test_functions import json, run


@pytest.fixture
def save():
    s, cleanup, session = DB()
    yield s
    cleanup()


def test_get_org_resolvers_by_org_super_admin_single_node(save, caplog):
    """
    Test org resolver by organization as a super admin, single node return
    """
    org1 = Organizations(
        name="Org1", acronym="ORG1", org_tags={"name": "Organization 1"}
    )

    super_admin = Users(
        display_name="testsuperadmin",
        user_name="testsuperadmin@testemail.ca",
        password="testpassword123",
    )

    super_admin.user_affiliation.append(
        User_affiliations(permission="super_admin", user_organization=org1)
    )

    save(super_admin)

    caplog.set_level(logging.INFO)
    result = run(
        query="""
        {
            organization:findOrganizationDetailBySlug(slug: "org1") {
                acronym
            }
        }
        """,
        as_user=super_admin,
    )

    if "errors" in result:
        fail("Tried to select org, instead: {}".format(json(result)))

    expected_result = {"data": {"organization": {"acronym": "ORG1"}}}

    assert result == expected_result
    assert (
        f"User: {super_admin.id} successfully retrieved organization info for org1"
        in caplog.text
    )


def test_org_resolvers_returns_all_orgs_to_super_admin(save, caplog):
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
    reader.verify_account()

    super_admin = Users(
        display_name="testsuperadmin",
        user_name="testsuperadmin@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(permission="super_admin", user_organization=org1)
        ],
    )
    super_admin.verify_account()

    save(reader)
    save(super_admin)

    caplog.set_level(logging.INFO)
    result = run(
        query="""
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
        as_user=super_admin,
    )

    if "errors" in result:
        fail("Tried to retrieve org names, instead: {}".format(json(result)))

    expected_result = {
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

    assert result == expected_result
    assert (
        f"Super admin: {super_admin.id} successfully retrieved all organizations."
        in caplog.text
    )


def test_org_resolvers_returns_single_org1_and_users_own_org_for_read_users(
    save, caplog
):
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
    reader.verify_account()

    super_admin = Users(
        display_name="testsuperadmin",
        user_name="testsuperadmin@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(permission="super_admin", user_organization=org1),
            User_affiliations(permission="super_admin", user_organization=org2),
        ],
    )
    super_admin.verify_account()

    save(reader)
    save(super_admin)

    caplog.set_level(logging.INFO)
    result = run(
        query="""
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
        as_user=reader,
    )

    if "errors" in result:
        fail("Tried to get org names as user read, instead: {}".format(json(result)))

    expected_result = {
        "data": {
            "organizations": {
                "edges": [
                    {"node": {"name": "Org1"}},
                    {"node": {"name": "testuserread@testemail.ca"}},
                ]
            }
        }
    }

    assert result == expected_result
    assert (
        f"User: {reader.id} successfully retrieved all organizations that they belong to."
        in caplog.text
    )


def test_org_resolvers_does_not_show_orgs_reader_is_not_affiliated_with(save, caplog):
    org1 = Organizations(name="Org1", acronym="ORG1")
    org2 = Organizations(name="Org2", acronym="ORG2")
    save(org2)

    reader = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org1)
        ],
    )

    save(reader)

    caplog.set_level(logging.WARNING)
    result = run(
        query="""
        {
            organization:findOrganizationDetailBySlug(slug: "org2") {
                name
            }
        }
        """,
        as_user=reader,
    )
    if "errors" not in result:
        fail(
            "Expected read user request for non-affiliated org to error. Instead: {}".format(
                result
            )
        )
    [err] = result["errors"]
    assert err["message"] == "Error, unable to find organization."
    assert (
        f"User: {reader.id} attempted to access an organization using org2, but does not have access to this organization"
        in caplog.text
    )
