import logging
import pytest

from pytest import fail

from db import DB
from models import Organizations, Domains, Users, User_affiliations
from tests.test_functions import json, run


@pytest.fixture()
def save():
    save, cleanup, db_session = DB()
    yield save
    cleanup()


def test_get_org_resolvers_by_org_super_admin_single_node(save, caplog):
    """
    Test org resolver by organization as a super admin, single node return
    with all values
    """
    org1 = Organizations(
        acronym="ORG1",
        domains=[Domains(domain="somecooldomain.ca")],
        name="Organization 1",
        org_tags={
            "zone": "Prov",
            "sector": "Banking",
            "province": "Alberta",
            "city": "Calgary",
        },
    )
    save(org1)

    super_admin = Users(
        display_name="testsuperadmin",
        user_name="testsuperadmin@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org1, permission="super_admin")
        ],
    )
    save(super_admin)
    user = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org1, permission="user_read")
        ],
    )
    save(user)

    caplog.set_level(logging.INFO)
    result = run(
        """
        {
            organization:findOrganizationDetailBySlug(slug: "organization-1") {
                name
                acronym
                province
                domains {
                    edges {
                        node {
                            url
                        }
                    }
                }
            }
        }
        """,
        as_user=super_admin,
    )

    expected_result = {
        "data": {
            "organization": {
                "name": "Organization 1",
                "acronym": "ORG1",
                "province": "Alberta",
                "domains": {"edges": [{"node": {"url": "somecooldomain.ca"}}]},
            }
        }
    }

    if "errors" in result:
        fail(
            "Expected super admin to return results for all users but got: {}".format(
                result["errors"]
            )
        )

    assert result == expected_result
    assert (
        f"User: {super_admin.id} successfully retrieved organization info for organization-1"
        in caplog.text
    )


# User read tests
def test_get_org_resolvers_by_org_user_read_single_node(save, caplog):
    """
    Test org resolver with an org as a user read, multi node return with
    all values
    """
    org1 = Organizations(
        acronym="ORG1",
        domains=[Domains(domain="somecooldomain.ca")],
        name="Organization 1",
        org_tags={
            "zone": "Prov",
            "sector": "Banking",
            "province": "Alberta",
            "city": "Calgary",
        },
    )
    save(org1)
    org2 = Organizations(
        acronym="ORG2",
        domains=[Domains(domain="anothercooldomain.ca")],
        name="Organization 2",
        org_tags={
            "zone": "Muni",
            "sector": "Transportation",
            "province": "NS",
            "city": "Halifax",
        },
    )
    save(org2)
    user = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org1, permission="user_read")
        ],
    )
    save(user)

    caplog.set_level(logging.INFO)
    result = run(
        """
        {
            organization:findOrganizationDetailBySlug(slug: "organization-1") {
                name
                acronym
                province
                domains {
                    edges {
                        node {
                            url
                        }
                    }
                }
            }
        }
        """,
        as_user=user,
    )

    expected_result = {
        "data": {
            "organization": {
                "name": "Organization 1",
                "acronym": "ORG1",
                "province": "Alberta",
                "domains": {"edges": [{"node": {"url": "somecooldomain.ca",}}]},
            }
        }
    }

    assert result == expected_result
    assert (
        f"User: {user.id} successfully retrieved organization info for organization-1"
        in caplog.text
    )
