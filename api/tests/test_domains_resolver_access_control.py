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


def test_get_domain_resolvers_by_url_super_admin_single_node(save, caplog):
    """
    Test domain resolver by url as a super admin, single node return
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

    test_domain = Domains(domain="sa.test.domain.ca", organization=org_one,)
    save(test_domain)

    caplog.set_level(logging.INFO)
    result = run(
        query="""
        {
            domain(urlSlug: "sa-test-domain-ca") {
                url
            }
        }
        """,
        as_user=super_admin,
    )

    if "errors" in result:
        fail(
            "Error occurred when trying to get a domain, error: {}".format(json(result))
        )

    expected_result = {"data": {"domain": [{"url": "sa.test.domain.ca"}]}}
    assert result == expected_result
    assert (
        f"User: {super_admin.id} successfully retrieved the domain information for sa-test-domain-ca"
        in caplog.text
    )


def test_get_domain_resolvers_by_org_super_admin_single_node(save, caplog):
    """
    Test domain resolver by organization as a super admin, single node
    return
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

    test_domain = Domains(domain="sa.test.domain.ca", organization=org_one,)
    save(test_domain)

    caplog.set_level(logging.INFO)
    result = run(
        query="""
        {
            domains(orgSlug: "organization-1") {
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
        fail(
            "Error occurred when trying to get a domain, error: {}".format(json(result))
        )

    expected_result = {
        "data": {"domains": {"edges": [{"node": {"url": "sa.test.domain.ca"}}]}}
    }
    assert result == expected_result
    assert (
        f"User: {super_admin.id}, successfully retrieved all domains for this org organization-1."
        in caplog.text
    )


def test_get_domain_resolvers_by_org_super_admin_multi_node(save, caplog):
    """
    Test domain resolver by organization as a super admin, multi node return
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
            domains(orgSlug: "organization-1") {
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
            "domains": {
                "edges": [
                    {"node": {"url": "sa.1.test.domain.ca"}},
                    {"node": {"url": "sa.2.test.domain.ca"}},
                ]
            }
        }
    }
    assert result == expected_result
    assert (
        f"User: {super_admin.id}, successfully retrieved all domains for this org organization-1."
        in caplog.text
    )


def test_get_domain_resolvers_by_url_super_admin_invalid_domain(save, caplog):
    """
    Test domain resolver by url as a super admin, invalid domain
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

    caplog.set_level(logging.WARNING)
    result = run(
        query="""
        {
            domain(urlSlug: "google-ca") {
                url
            }
        }
        """,
        as_user=super_admin,
    )

    if "errors" not in result:
        fail("Expected error, instead: {}".format(json(result)))

    [error] = result["errors"]
    assert error["message"] == "Error, unable to find domain."
    assert (
        f"User: {super_admin.id} attempted to access a domain using google-ca, but domain was not found."
        in caplog.text
    )


def test_get_domain_resolvers_by_org_super_admin_org_no_domains(save, caplog):
    """
    Test domain resolver by org as a super admin, org has no domains
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
            domains(orgSlug: "organization-1") {
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
        f"User: {super_admin.id} attempted to access an organizations domains using organization-1, but no domains were found."
        in caplog.text
    )


def test_get_domain_resolvers_by_url_user_read_single_node(save, caplog):
    """
    Test domain resolver get domain by url as user read, return as
    single node
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

    test_domain = Domains(domain="user.read.test.domain.ca", organization=org_one,)
    save(test_domain)

    caplog.set_level(logging.INFO)
    result = run(
        query="""
        {
            domain(urlSlug: "user-read-test-domain-ca") {
                url
            }
        }
        """,
        as_user=user_read,
    )

    if "errors" in result:
        fail(
            "Error occurred when trying to get a domain, error: {}".format(json(result))
        )

    expected_result = {"data": {"domain": [{"url": "user.read.test.domain.ca"}]}}
    assert result == expected_result
    assert (
        f"User: {user_read.id} successfully retrieved the domain information for user-read-test-domain-ca"
        in caplog.text
    )


def test_get_domain_resolvers_by_org_user_read_multi_node(save, caplog):
    """
    Test domain resolver get domain by org as user read, return as
    multi node
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
            domains(orgSlug: "organization-1") {
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
            "domains": {
                "edges": [
                    {"node": {"url": "user.read.1.test.domain.ca"}},
                    {"node": {"url": "user.read.2.test.domain.ca"}},
                ]
            }
        }
    }
    assert result == expected_result
    assert f"User: {user_read.id}, successfully retrieved all domains for this org organization-1."


def test_get_domain_resolvers_by_url_user_read_no_access(save, caplog):
    """
    Test domain resolver get domain by url as user read, user has no rights
    to view domains related to that org
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1"
    )
    save(org_one)
    org_two = Organizations(
        acronym="ORG2", name="Organization 2", slug="organization-2"
    )
    save(org_two)

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

    test_domain_1 = Domains(domain="user.read.1.test.domain.ca", organization=org_two,)
    save(test_domain_1)

    caplog.set_level(logging.WARNING)
    result = run(
        query="""
        {
            domain(urlSlug: "user-read-1-test-domain-ca") {
                url
            }
        }
        """,
        as_user=user_read,
    )

    if "errors" not in result:
        fail("Expected error, instead: {}".format(json(result)))

    [error] = result["errors"]
    assert error["message"] == "Error, unable to find domain."
    assert f"User: {user_read.id} attempted to access a domain using user-read-1-test-domain-ca, but does not have access to {org_two.slug}."


def test_get_domain_resolvers_by_org_user_read_no_access(save, caplog):
    """
    Test domain resolver get domain by org as user read, user has no rights
    to view domains related to that org
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1"
    )
    save(org_one)
    org_two = Organizations(
        acronym="ORG2", name="Organization 2", slug="organization-2"
    )
    save(org_two)

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

    test_domain_1 = Domains(domain="user.read.1.test.domain.ca", organization=org_two,)
    save(test_domain_1)

    caplog.set_level(logging.WARNING)
    result = run(
        query="""
        {
            domains(orgSlug: "organization-2") {
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
        f"User: {user_read.id} attempted to access an organizations domains using {org_two.slug}, but does not have access to this organization."
        in caplog.text
    )


def test_get_domain_resolvers_by_url_user_read_invalid_domain(save, caplog):
    """
    Test domain resolver get domain by url as user read, url does not
    exist
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
            domain(urlSlug: "google-ca") {
                url
            }
        }
        """,
        as_user=user_read,
    )

    if "errors" not in result:
        fail("Expected error, instead: {}".format(json(result)))

    [error] = result["errors"]
    assert error["message"] == "Error, unable to find domain."
    assert (
        f"User: {user_read.id} attempted to access a domain using google-ca, but domain was not found."
        in caplog.text
    )


def test_get_domain_resolvers_by_org_user_read_org_no_domains(save, caplog):
    """
    Test domain resolver get domain by org as user read, org has no related
    domains
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
            domains(orgSlug: "organization-1") {
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
        f"User: {user_read.id} attempted to access an organizations domains using organization-1, but no domains were found."
        in caplog.text
    )
