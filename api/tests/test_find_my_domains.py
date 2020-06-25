import logging
import pytest

from pytest import fail

from db import DB
from models import Organizations, Domains, Users, User_affiliations
from tests.test_functions import json, run


@pytest.fixture()
def save():
    s, cleanup, db_session = DB()
    yield s
    cleanup()


def test_find_my_domains_super_admin_multi_node(save, caplog):
    """
    Test find my domains as a super admin
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1"
    )
    save(org_one)

    super_admin = Users(
        display_name="testsuperadmin",
        user_name="testsuperadmin@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(
                permission="super_admin",
                user_organization=Organizations(
                    acronym="SA", name="Super Admin", slug="super-admin"
                ),
            ),
        ],
    )
    save(super_admin)

    test_domain_1 = Domains(domain="sa.1.test.domain.ca", organization=org_one,)
    save(test_domain_1)
    test_domain_2 = Domains(domain="sa.2.test.domain.ca", organization=org_one,)
    save(test_domain_2)

    caplog.set_level(logging.INFO)
    result = run(
        query="""
        {
            findMyDomains {
                edges {
                    node {
                        url
                    }
                }
            }
        }
        """,
        as_user=super_admin,
    )

    if "errors" in result:
        fail("Tried to get multiple domains, instead: {}".format(json(result)))

    expected_result = {
        "data": {
            "findMyDomains": {
                "edges": [
                    {"node": {"url": "sa.1.test.domain.ca"}},
                    {"node": {"url": "sa.2.test.domain.ca"}},
                ]
            }
        }
    }
    assert result == expected_result
    assert (
        f"Super Admin: {super_admin.id}, successfully retrieved all domains for all orgs that they have access to."
        in caplog.text
    )


def test_find_my_domains_super_admin_org_no_domains(save, caplog):
    """
    Test find my domains as a super admin, org has no domains
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1"
    )
    save(org_one)

    super_admin = Users(
        display_name="testsuperadmin",
        user_name="testsuperadmin@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(
                permission="super_admin",
                user_organization=Organizations(
                    acronym="SA", name="Super Admin", slug="super-admin"
                ),
            ),
        ],
    )
    save(super_admin)

    caplog.set_level(logging.INFO)
    result = run(
        query="""
        {
            findMyDomains {
                edges {
                    node {
                        url
                    }
                }
            }
        }
        """,
        as_user=super_admin,
    )

    if "errors" not in result:
        fail("Expected error, instead: {}".format(json(result)))

    [error] = result["errors"]
    assert error["message"] == "Error, unable to find domains."
    assert (
        f"Super Admin: {super_admin.id} tried to gather all domains, but none were found."
        in caplog.text
    )


def test_find_my_domains_user_read_multi_node(save, caplog):
    """
    Test find my domains as user read, return as multi node
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1"
    )
    save(org_one)

    user_read = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org_one,),
        ],
    )
    save(user_read)

    test_domain_1 = Domains(domain="user.read.1.test.domain.ca", organization=org_one,)
    save(test_domain_1)

    test_domain_2 = Domains(domain="user.read.2.test.domain.ca", organization=org_one,)
    save(test_domain_2)

    caplog.set_level(logging.INFO)
    result = run(
        query="""
        {
            findMyDomains {
                edges {
                    node {
                        url
                    }
                }
            }
        }
        """,
        as_user=user_read,
    )

    if "errors" in result:
        fail(
            "Error occurred when trying to get domains, error: {}".format(json(result))
        )

    expected_result = {
        "data": {
            "findMyDomains": {
                "edges": [
                    {"node": {"url": "user.read.1.test.domain.ca"}},
                    {"node": {"url": "user.read.2.test.domain.ca"}},
                ]
            }
        }
    }
    assert result == expected_result
    assert (
        f"User: {user_read.id}, successfully retrieved all domains for all orgs that they have access to."
        in caplog.text
    )


def test_find_my_domains_user_read_org_no_domains(save, caplog):
    """
    Test find my domains as user read, org has no related domains
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1"
    )
    save(org_one)

    user_read = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org_one,),
        ],
    )
    save(user_read)

    caplog.set_level(logging.INFO)
    result = run(
        query="""
        {
            findMyDomains {
                edges {
                    node {
                        url
                    }
                }
            }
        }
        """,
        as_user=user_read,
    )

    if "errors" not in result:
        fail("Expected error, instead: {}".format(json(result)))

    [error] = result["errors"]
    assert error["message"] == "Error, unable to find domains."
    assert (
        f"User: {user_read.id}, tried to access all the domains for all the orgs that they belong to but none were found."
        in caplog.text
    )
