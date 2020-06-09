import pytest
from pytest import fail

from db import DB
from models import Users, Organizations, Domains, Scans, Spf_scans, User_affiliations
from tests.testdata.domain_guidance_tags import spf_mock_data
from tests.test_functions import json, run


@pytest.fixture
def save():
    save, cleanup, session = DB()
    yield save
    cleanup()


def test_spf_guidance_tags_spf_2(save):
    """
    Test that spf guidance tag spf 2 shows up
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

    test_spf_scan = Spf_scans(
        id=test_scan.id,
        spf_scan=spf_mock_data.get("spf_mock_data_spf2")
    )
    save(test_spf_scan)

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
                email {
                    edges {
                        node {
                            spf {
                                spfGuidanceTags {
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
            "expected spf guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert "{'spf2': 'SPF-missing'}" in result["data"]["domain"][0]["email"]["edges"][0]["node"]["spf"]["spfGuidanceTags"]["value"]


@pytest.mark.skip
def test_spf_guidance_tags_spf_3(save):
    """
    Test that spf guidance tag spf 3 shows up
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

    test_dkim_scan = Spf_scans(
        id=test_scan.id,
        spf_scan=spf_mock_data.get("spf_mock_data_spf3")
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
                email {
                    edges {
                        node {
                            spf {
                                spfGuidanceTags {
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
            "expected spf guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert "{'spf3': 'SPF-bad-path'}" in result["data"]["domain"][0]["email"]["edges"][0]["node"]["spf"]["spfGuidanceTags"]["value"]


def test_spf_guidance_tags_spf_4(save):
    """
    Test that spf guidance tag spf 4 shows up
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

    test_dkim_scan = Spf_scans(
        id=test_scan.id,
        spf_scan=spf_mock_data.get("spf_mock_data_spf4")
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
                email {
                    edges {
                        node {
                            spf {
                                spfGuidanceTags {
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
            "expected spf guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert "{'spf4': 'ALL-missing'}" in result["data"]["domain"][0]["email"]["edges"][0]["node"]["spf"]["spfGuidanceTags"]["value"]


def test_spf_guidance_tags_spf_5(save):
    """
    Test that spf guidance tag spf 5 shows up
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

    test_dkim_scan = Spf_scans(
        id=test_scan.id,
        spf_scan=spf_mock_data.get("spf_mock_data_spf5")
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
                email {
                    edges {
                        node {
                            spf {
                                spfGuidanceTags {
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
            "expected spf guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert "{'spf5': 'ALL-allow'}" in result["data"]["domain"][0]["email"]["edges"][0]["node"]["spf"]["spfGuidanceTags"]["value"]


def test_spf_guidance_tags_spf_6(save):
    """
    Test that spf guidance tag spf 6 shows up
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

    test_dkim_scan = Spf_scans(
        id=test_scan.id,
        spf_scan=spf_mock_data.get("spf_mock_data_spf6")
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
                email {
                    edges {
                        node {
                            spf {
                                spfGuidanceTags {
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
            "expected spf guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert "{'spf6': 'ALL-neutral'}" in result["data"]["domain"][0]["email"]["edges"][0]["node"]["spf"]["spfGuidanceTags"]["value"]


def test_spf_guidance_tags_spf_7(save):
    """
    Test that spf guidance tag spf 7 shows up
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

    test_dkim_scan = Spf_scans(
        id=test_scan.id,
        spf_scan=spf_mock_data.get("spf_mock_data_spf7")
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
                email {
                    edges {
                        node {
                            spf {
                                spfGuidanceTags {
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
            "expected spf guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert "{'spf7': 'ALL-softfail'}" in result["data"]["domain"][0]["email"]["edges"][0]["node"]["spf"]["spfGuidanceTags"]["value"]


def test_spf_guidance_tags_spf_8(save):
    """
    Test that spf guidance tag spf 8 shows up
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

    test_dkim_scan = Spf_scans(
        id=test_scan.id,
        spf_scan=spf_mock_data.get("spf_mock_data_spf8")
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
                email {
                    edges {
                        node {
                            spf {
                                spfGuidanceTags {
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
            "expected spf guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert "{'spf8': 'ALL-hardfail'}" in result["data"]["domain"][0]["email"]["edges"][0]["node"]["spf"]["spfGuidanceTags"]["value"]


def test_spf_guidance_tags_spf_9(save):
    """
    Test that spf guidance tag spf 9 shows up
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

    test_dkim_scan = Spf_scans(
        id=test_scan.id,
        spf_scan=spf_mock_data.get("spf_mock_data_spf9")
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
                email {
                    edges {
                        node {
                            spf {
                                spfGuidanceTags {
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
            "expected spf guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert "{'spf9': 'ALL-redirect'}" in result["data"]["domain"][0]["email"]["edges"][0]["node"]["spf"]["spfGuidanceTags"]["value"]


def test_spf_guidance_tags_spf_10(save):
    """
    Test that spf guidance tag spf 10 shows up
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

    test_dkim_scan = Spf_scans(
        id=test_scan.id,
        spf_scan=spf_mock_data.get("spf_mock_data_spf10")
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
                email {
                    edges {
                        node {
                            spf {
                                spfGuidanceTags {
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
            "expected spf guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert "{'spf10': 'ALL-invalid'}" in result["data"]["domain"][0]["email"]["edges"][0]["node"]["spf"]["spfGuidanceTags"]["value"]


def test_spf_guidance_tags_spf_11(save):
    """
    Test that spf guidance tag spf 11 shows up
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

    test_dkim_scan = Spf_scans(
        id=test_scan.id,
        spf_scan=spf_mock_data.get("spf_mock_data_spf11")
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
                email {
                    edges {
                        node {
                            spf {
                                spfGuidanceTags {
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
            "expected spf guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert "{'spf11': 'A-all'}" in result["data"]["domain"][0]["email"]["edges"][0]["node"]["spf"]["spfGuidanceTags"]["value"]


def test_spf_guidance_tags_spf_12(save):
    """
    Test that spf guidance tag spf 12 shows up
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

    test_dkim_scan = Spf_scans(
        id=test_scan.id,
        spf_scan=spf_mock_data.get("spf_mock_data_spf12")
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
                email {
                    edges {
                        node {
                            spf {
                                spfGuidanceTags {
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
            "expected spf guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert "{'spf12': 'INCLUDE-limit'}" in result["data"]["domain"][0]["email"]["edges"][0]["node"]["spf"]["spfGuidanceTags"]["value"]


def test_spf_guidance_tags_spf_13(save):
    """
    Test that spf guidance tag spf 13 shows up
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

    test_dkim_scan = Spf_scans(
        id=test_scan.id,
        spf_scan=spf_mock_data.get("spf_mock_data_spf13")
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
                email {
                    edges {
                        node {
                            spf {
                                spfGuidanceTags {
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
            "expected spf guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert "{'spf13': 'INCLUDE-missing'}" in result["data"]["domain"][0]["email"]["edges"][0]["node"]["spf"]["spfGuidanceTags"]["value"]
