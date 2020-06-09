import pytest
from pytest import fail

from db import DB
from models import Users, Organizations, Domains, Scans, Ssl_scans, User_affiliations
from tests.testdata.domain_guidance_tags import ssl_mock_data
from tests.test_functions import json, run


@pytest.fixture
def save():
    save, cleanup, session = DB()
    yield save
    cleanup()


def test_spf_guidance_tags_spf_2(save):
    """
    Test that ssl guidance tag ssl 2 shows up
    """
    org_one = Organizations(
        acronym="ORG1",
        name="Organization 1",
        slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one,
        domain="test.domain.ca",
        slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Scans(
        domain=test_domain
    )
    save(test_scan)

    test_dkim_scan = Ssl_scans(
        id=test_scan.id,
        ssl_scan=ssl_mock_data.get("ssl_mock_data_ssl2")
    )
    save(test_dkim_scan)

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(
                permission="user_read",
                user_organization=org_one
            ),
        ],
    )
    save(user)

    result = run(
        mutation="""
        {
            domain(
                urlSlug: "test-domain-ca"
            ) {
                www {
                    edges {
                        node {
                            ssl {
                                sslGuidanceTags {
                                    value
                                }
                            }
                        }
                    }
                }
            }
        }
        """,
        as_user=user
    )

    if "errors" in result:
        fail(
            "expected ssl guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert "{'ssl2': 'SSL-missing'}" in result["data"]["domain"][0]["www"]["edges"][0]["node"]["ssl"]["sslGuidanceTags"]["value"]


def test_spf_guidance_tags_spf_3(save):
    """
    Test that ssl guidance tag ssl 3 shows up
    """
    org_one = Organizations(
        acronym="ORG1",
        name="Organization 1",
        slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one,
        domain="test.domain.ca",
        slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Scans(
        domain=test_domain
    )
    save(test_scan)

    test_dkim_scan = Ssl_scans(
        id=test_scan.id,
        ssl_scan=ssl_mock_data.get("ssl_mock_data_ssl3")
    )
    save(test_dkim_scan)

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(
                permission="user_read",
                user_organization=org_one
            ),
        ],
    )
    save(user)

    result = run(
        mutation="""
        {
            domain(
                urlSlug: "test-domain-ca"
            ) {
                www {
                    edges {
                        node {
                            ssl {
                                sslGuidanceTags {
                                    value
                                }
                            }
                        }
                    }
                }
            }
        }
        """,
        as_user=user
    )

    if "errors" in result:
        fail(
            "expected ssl guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert "{'ssl3': 'SSL-rc4'}" in result["data"]["domain"][0]["www"]["edges"][0]["node"]["ssl"]["sslGuidanceTags"]["value"]


def test_spf_guidance_tags_spf_4(save):
    """
    Test that ssl guidance tag ssl 4 shows up
    """
    org_one = Organizations(
        acronym="ORG1",
        name="Organization 1",
        slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one,
        domain="test.domain.ca",
        slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Scans(
        domain=test_domain
    )
    save(test_scan)

    test_dkim_scan = Ssl_scans(
        id=test_scan.id,
        ssl_scan=ssl_mock_data.get("ssl_mock_data_ssl4")
    )
    save(test_dkim_scan)

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(
                permission="user_read",
                user_organization=org_one
            ),
        ],
    )
    save(user)

    result = run(
        mutation="""
        {
            domain(
                urlSlug: "test-domain-ca"
            ) {
                www {
                    edges {
                        node {
                            ssl {
                                sslGuidanceTags {
                                    value
                                }
                            }
                        }
                    }
                }
            }
        }
        """,
        as_user=user
    )

    if "errors" in result:
        fail(
            "expected ssl guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert "{'ssl4': 'SSL-3des'}" in result["data"]["domain"][0]["www"]["edges"][0]["node"]["ssl"]["sslGuidanceTags"]["value"]


def test_spf_guidance_tags_spf_5(save):
    """
    Test that ssl guidance tag ssl 5 shows up
    """
    org_one = Organizations(
        acronym="ORG1",
        name="Organization 1",
        slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one,
        domain="test.domain.ca",
        slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Scans(
        domain=test_domain
    )
    save(test_scan)

    test_dkim_scan = Ssl_scans(
        id=test_scan.id,
        ssl_scan=ssl_mock_data.get("ssl_mock_data_ssl5")
    )
    save(test_dkim_scan)

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(
                permission="user_read",
                user_organization=org_one
            ),
        ],
    )
    save(user)

    result = run(
        mutation="""
        {
            domain(
                urlSlug: "test-domain-ca"
            ) {
                www {
                    edges {
                        node {
                            ssl {
                                sslGuidanceTags {
                                    value
                                }
                            }
                        }
                    }
                }
            }
        }
        """,
        as_user=user
    )

    if "errors" in result:
        fail(
            "expected ssl guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert "{'ssl5': 'SSL-acceptable-certificate'}" in result["data"]["domain"][0]["www"]["edges"][0]["node"]["ssl"]["sslGuidanceTags"]["value"]


def test_spf_guidance_tags_spf_6(save):
    """
    Test that ssl guidance tag ssl 6 shows up
    """
    org_one = Organizations(
        acronym="ORG1",
        name="Organization 1",
        slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one,
        domain="test.domain.ca",
        slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Scans(
        domain=test_domain
    )
    save(test_scan)

    test_dkim_scan = Ssl_scans(
        id=test_scan.id,
        ssl_scan=ssl_mock_data.get("ssl_mock_data_ssl6")
    )
    save(test_dkim_scan)

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(
                permission="user_read",
                user_organization=org_one
            ),
        ],
    )
    save(user)

    result = run(
        mutation="""
        {
            domain(
                urlSlug: "test-domain-ca"
            ) {
                www {
                    edges {
                        node {
                            ssl {
                                sslGuidanceTags {
                                    value
                                }
                            }
                        }
                    }
                }
            }
        }
        """,
        as_user=user
    )

    if "errors" in result:
        fail(
            "expected ssl guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert "{'ssl6': 'SSL-invalid-cipher'}" in result["data"]["domain"][0]["www"]["edges"][0]["node"]["ssl"]["sslGuidanceTags"]["value"]


def test_spf_guidance_tags_spf_7(save):
    """
    Test that ssl guidance tag ssl 7 shows up
    """
    org_one = Organizations(
        acronym="ORG1",
        name="Organization 1",
        slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one,
        domain="test.domain.ca",
        slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Scans(
        domain=test_domain
    )
    save(test_scan)

    test_dkim_scan = Ssl_scans(
        id=test_scan.id,
        ssl_scan=ssl_mock_data.get("ssl_mock_data_ssl7")
    )
    save(test_dkim_scan)

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(
                permission="user_read",
                user_organization=org_one
            ),
        ],
    )
    save(user)

    result = run(
        mutation="""
        {
            domain(
                urlSlug: "test-domain-ca"
            ) {
                www {
                    edges {
                        node {
                            ssl {
                                sslGuidanceTags {
                                    value
                                }
                            }
                        }
                    }
                }
            }
        }
        """,
        as_user=user
    )

    if "errors" in result:
        fail(
            "expected ssl guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert "{'ssl7': 'Vulnerability-heartbleed'}" in result["data"]["domain"][0]["www"]["edges"][0]["node"]["ssl"]["sslGuidanceTags"]["value"]


def test_spf_guidance_tags_spf_8(save):
    """
    Test that ssl guidance tag ssl 8 shows up
    """
    org_one = Organizations(
        acronym="ORG1",
        name="Organization 1",
        slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one,
        domain="test.domain.ca",
        slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Scans(
        domain=test_domain
    )
    save(test_scan)

    test_dkim_scan = Ssl_scans(
        id=test_scan.id,
        ssl_scan=ssl_mock_data.get("ssl_mock_data_ssl8")
    )
    save(test_dkim_scan)

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(
                permission="user_read",
                user_organization=org_one
            ),
        ],
    )
    save(user)

    result = run(
        mutation="""
        {
            domain(
                urlSlug: "test-domain-ca"
            ) {
                www {
                    edges {
                        node {
                            ssl {
                                sslGuidanceTags {
                                    value
                                }
                            }
                        }
                    }
                }
            }
        }
        """,
        as_user=user
    )

    if "errors" in result:
        fail(
            "expected ssl guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert "{'ssl8': 'Vulnerability-ccs-injection'}" in result["data"]["domain"][0]["www"]["edges"][0]["node"]["ssl"]["sslGuidanceTags"]["value"]
