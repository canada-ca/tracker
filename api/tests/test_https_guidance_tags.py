import pytest
from pytest import fail

from db import DB
from models import (
    Users,
    Organizations,
    Domains,
    Web_scans,
    Https_scans,
    User_affiliations,
)
from tests.testdata.domain_guidance_tags import https_mock_data
from tests.test_functions import json, run


@pytest.fixture
def save():
    save, cleanup, session = DB()
    yield save
    cleanup()


def test_dkim_guidance_tags_https_2(save):
    """
    Test that https guidance tag https 2 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Web_scans(domain=test_domain)
    save(test_scan)

    test_https_scan = Https_scans(
        id=test_scan.id, https_scan=https_mock_data.get("https_mock_data_https2")
    )
    save(test_https_scan)

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org_one),
        ],
    )
    save(user)

    result = run(
        mutation="""
        {
            findDomainBySlug(
                input: {
                    urlSlug: "test-domain-ca"
                }
            ) {
                web {
                    edges {
                        node {
                            https {
                                httpsGuidanceTags
                            }
                        }
                    }
                }
            }
        }
        """,
        as_user=user,
    )

    if "errors" in result:
        fail(
            "expected https guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "https2"
        in result["data"]["findDomainBySlug"]["web"]["edges"][0]["node"]["https"][
            "httpsGuidanceTags"
        ]
    )


def test_dkim_guidance_tags_https_3(save):
    """
    Test that https guidance tag https 3 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Web_scans(domain=test_domain)
    save(test_scan)

    test_dkim_scan = Https_scans(
        id=test_scan.id, https_scan=https_mock_data.get("https_mock_data_https3")
    )
    save(test_dkim_scan)

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org_one),
        ],
    )
    save(user)

    result = run(
        mutation="""
        {
            findDomainBySlug(
                input: {
                    urlSlug: "test-domain-ca"
                }
            ) {
                web {
                    edges {
                        node {
                            https {
                                httpsGuidanceTags
                            }
                        }
                    }
                }
            }
        }
        """,
        as_user=user,
    )

    if "errors" in result:
        fail(
            "expected https guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "https3"
        in result["data"]["findDomainBySlug"]["web"]["edges"][0]["node"]["https"][
            "httpsGuidanceTags"
        ]
    )


def test_dkim_guidance_tags_https_4(save):
    """
    Test that https guidance tag https 4 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Web_scans(domain=test_domain)
    save(test_scan)

    test_dkim_scan = Https_scans(
        id=test_scan.id, https_scan=https_mock_data.get("https_mock_data_https4")
    )
    save(test_dkim_scan)

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org_one),
        ],
    )
    save(user)

    result = run(
        mutation="""
        {
            findDomainBySlug(
                input: {
                    urlSlug: "test-domain-ca"
                }
            ) {
                web {
                    edges {
                        node {
                            https {
                                httpsGuidanceTags
                            }
                        }
                    }
                }
            }
        }
        """,
        as_user=user,
    )

    if "errors" in result:
        fail(
            "expected https guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "https4"
        in result["data"]["findDomainBySlug"]["web"]["edges"][0]["node"]["https"][
            "httpsGuidanceTags"
        ]
    )


def test_dkim_guidance_tags_https_5(save):
    """
    Test that https guidance tag https 5 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Web_scans(domain=test_domain)
    save(test_scan)

    test_dkim_scan = Https_scans(
        id=test_scan.id, https_scan=https_mock_data.get("https_mock_data_https5")
    )
    save(test_dkim_scan)

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org_one),
        ],
    )
    save(user)

    result = run(
        mutation="""
        {
            findDomainBySlug(
                input: {
                    urlSlug: "test-domain-ca"
                }
            ) {
                web {
                    edges {
                        node {
                            https {
                                httpsGuidanceTags
                            }
                        }
                    }
                }
            }
        }
        """,
        as_user=user,
    )

    if "errors" in result:
        fail(
            "expected https guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "https5"
        in result["data"]["findDomainBySlug"]["web"]["edges"][0]["node"]["https"][
            "httpsGuidanceTags"
        ]
    )


def test_dkim_guidance_tags_https_6(save):
    """
    Test that https guidance tag https 6 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Web_scans(domain=test_domain)
    save(test_scan)

    test_dkim_scan = Https_scans(
        id=test_scan.id, https_scan=https_mock_data.get("https_mock_data_https6")
    )
    save(test_dkim_scan)

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org_one),
        ],
    )
    save(user)

    result = run(
        mutation="""
        {
            findDomainBySlug(
                input: {
                    urlSlug: "test-domain-ca"
                }
            ) {
                web {
                    edges {
                        node {
                            https {
                                httpsGuidanceTags
                            }
                        }
                    }
                }
            }
        }
        """,
        as_user=user,
    )

    if "errors" in result:
        fail(
            "expected https guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "https6"
        in result["data"]["findDomainBySlug"]["web"]["edges"][0]["node"]["https"][
            "httpsGuidanceTags"
        ]
    )


def test_dkim_guidance_tags_https_7(save):
    """
    Test that https guidance tag https 7 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Web_scans(domain=test_domain)
    save(test_scan)

    test_dkim_scan = Https_scans(
        id=test_scan.id, https_scan=https_mock_data.get("https_mock_data_https7")
    )
    save(test_dkim_scan)

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org_one),
        ],
    )
    save(user)

    result = run(
        mutation="""
        {
            findDomainBySlug(
                input: {
                    urlSlug: "test-domain-ca"
                }
            ) {
                web {
                    edges {
                        node {
                            https {
                                httpsGuidanceTags
                            }
                        }
                    }
                }
            }
        }
        """,
        as_user=user,
    )

    if "errors" in result:
        fail(
            "expected https guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "https7"
        in result["data"]["findDomainBySlug"]["web"]["edges"][0]["node"]["https"][
            "httpsGuidanceTags"
        ]
    )


def test_dkim_guidance_tags_https_8(save):
    """
    Test that https guidance tag https 8 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Web_scans(domain=test_domain)
    save(test_scan)

    test_dkim_scan = Https_scans(
        id=test_scan.id, https_scan=https_mock_data.get("https_mock_data_https8")
    )
    save(test_dkim_scan)

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org_one),
        ],
    )
    save(user)

    result = run(
        mutation="""
        {
            findDomainBySlug(
                input: {
                    urlSlug: "test-domain-ca"
                }
            ) {
                web {
                    edges {
                        node {
                            https {
                                httpsGuidanceTags
                            }
                        }
                    }
                }
            }
        }
        """,
        as_user=user,
    )

    if "errors" in result:
        fail(
            "expected https guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "https8"
        in result["data"]["findDomainBySlug"]["web"]["edges"][0]["node"]["https"][
            "httpsGuidanceTags"
        ]
    )


def test_dkim_guidance_tags_https_9(save):
    """
    Test that https guidance tag https 9 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Web_scans(domain=test_domain)
    save(test_scan)

    test_dkim_scan = Https_scans(
        id=test_scan.id, https_scan=https_mock_data.get("https_mock_data_https9")
    )
    save(test_dkim_scan)

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org_one),
        ],
    )
    save(user)

    result = run(
        mutation="""
        {
            findDomainBySlug(
                input: {
                    urlSlug: "test-domain-ca"
                }
            ) {
                web {
                    edges {
                        node {
                            https {
                                httpsGuidanceTags
                            }
                        }
                    }
                }
            }
        }
        """,
        as_user=user,
    )

    if "errors" in result:
        fail(
            "expected https guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "https9"
        in result["data"]["findDomainBySlug"]["web"]["edges"][0]["node"]["https"][
            "httpsGuidanceTags"
        ]
    )


def test_dkim_guidance_tags_https_10(save):
    """
    Test that https guidance tag https 10 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Web_scans(domain=test_domain)
    save(test_scan)

    test_dkim_scan = Https_scans(
        id=test_scan.id, https_scan=https_mock_data.get("https_mock_data_https10")
    )
    save(test_dkim_scan)

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org_one),
        ],
    )
    save(user)

    result = run(
        mutation="""
        {
            findDomainBySlug(
                input: {
                    urlSlug: "test-domain-ca"
                }
            ) {
                web {
                    edges {
                        node {
                            https {
                                httpsGuidanceTags
                            }
                        }
                    }
                }
            }
        }
        """,
        as_user=user,
    )

    if "errors" in result:
        fail(
            "expected https guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "https10"
        in result["data"]["findDomainBySlug"]["web"]["edges"][0]["node"]["https"][
            "httpsGuidanceTags"
        ]
    )


def test_dkim_guidance_tags_https_11(save):
    """
    Test that https guidance tag https 11 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Web_scans(domain=test_domain)
    save(test_scan)

    test_dkim_scan = Https_scans(
        id=test_scan.id, https_scan=https_mock_data.get("https_mock_data_https11")
    )
    save(test_dkim_scan)

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org_one),
        ],
    )
    save(user)

    result = run(
        mutation="""
        {
            findDomainBySlug(
                input: {
                    urlSlug: "test-domain-ca"
                }
            ) {
                web {
                    edges {
                        node {
                            https {
                                httpsGuidanceTags
                            }
                        }
                    }
                }
            }
        }
        """,
        as_user=user,
    )

    if "errors" in result:
        fail(
            "expected https guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "https11"
        in result["data"]["findDomainBySlug"]["web"]["edges"][0]["node"]["https"][
            "httpsGuidanceTags"
        ]
    )


def test_dkim_guidance_tags_https_12(save):
    """
    Test that https guidance tag https 12 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Web_scans(domain=test_domain)
    save(test_scan)

    test_dkim_scan = Https_scans(
        id=test_scan.id, https_scan=https_mock_data.get("https_mock_data_https12")
    )
    save(test_dkim_scan)

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org_one),
        ],
    )
    save(user)

    result = run(
        mutation="""
        {
            findDomainBySlug(
                input: {
                    urlSlug: "test-domain-ca"
                }
            ) {
                web {
                    edges {
                        node {
                            https {
                                httpsGuidanceTags
                            }
                        }
                    }
                }
            }
        }
        """,
        as_user=user,
    )

    if "errors" in result:
        fail(
            "expected https guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "https12"
        in result["data"]["findDomainBySlug"]["web"]["edges"][0]["node"]["https"][
            "httpsGuidanceTags"
        ]
    )


def test_dkim_guidance_tags_https_13(save):
    """
    Test that https guidance tag https 13 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Web_scans(domain=test_domain)
    save(test_scan)

    test_dkim_scan = Https_scans(
        id=test_scan.id, https_scan=https_mock_data.get("https_mock_data_https13")
    )
    save(test_dkim_scan)

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org_one),
        ],
    )
    save(user)

    result = run(
        mutation="""
        {
            findDomainBySlug(
                input: {
                    urlSlug: "test-domain-ca"
                }
            ) {
                web {
                    edges {
                        node {
                            https {
                                httpsGuidanceTags
                            }
                        }
                    }
                }
            }
        }
        """,
        as_user=user,
    )

    if "errors" in result:
        fail(
            "expected https guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "https13"
        in result["data"]["findDomainBySlug"]["web"]["edges"][0]["node"]["https"][
            "httpsGuidanceTags"
        ]
    )


def test_dkim_guidance_tags_https_14(save):
    """
    Test that https guidance tag https 14 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Web_scans(domain=test_domain)
    save(test_scan)

    test_dkim_scan = Https_scans(
        id=test_scan.id, https_scan=https_mock_data.get("https_mock_data_https14")
    )
    save(test_dkim_scan)

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org_one),
        ],
    )
    save(user)

    result = run(
        mutation="""
        {
            findDomainBySlug(
                input: {
                    urlSlug: "test-domain-ca"
                }
            ) {
                web {
                    edges {
                        node {
                            https {
                                httpsGuidanceTags
                            }
                        }
                    }
                }
            }
        }
        """,
        as_user=user,
    )

    if "errors" in result:
        fail(
            "expected https guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "https14"
        in result["data"]["findDomainBySlug"]["web"]["edges"][0]["node"]["https"][
            "httpsGuidanceTags"
        ]
    )
