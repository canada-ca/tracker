import pytest
from pytest import fail

from db import DB
from models import (
    Users,
    Organizations,
    Domains,
    Mail_scans,
    Dkim_scans,
    Dmarc_scans,
    Spf_scans,
    User_affiliations,
)
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
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Mail_scans(domain=test_domain)
    save(test_scan)

    test_spf_scan = Spf_scans(
        id=test_scan.id, spf_scan=spf_mock_data.get("spf_mock_data_spf2")
    )
    save(test_spf_scan)

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
                urlSlug: "test-domain-ca"
            ) {
                email {
                    edges {
                        node {
                            spf {
                                spfGuidanceTags
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
            "expected spf guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "spf2"
        in result["data"]["findDomainBySlug"]["email"]["edges"][0]["node"]["spf"][
            "spfGuidanceTags"
        ]
    )


def test_spf_guidance_tags_spf_3_dkim(save):
    """
    Test that spf guidance tag spf 3 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Mail_scans(domain=test_domain)
    save(test_scan)

    test_spf_scan = Spf_scans(
        id=test_scan.id,
        spf_scan=spf_mock_data.get("spf_mock_data_spf3").get("spf_mock_data_spf3_spf"),
    )
    save(test_spf_scan)

    test_dkim_scan = Dkim_scans(
        id=test_scan.id,
        dkim_scan=spf_mock_data.get("spf_mock_data_spf3").get(
            "spf_mock_data_spf3_dkim"
        ),
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
                urlSlug: "test-domain-ca"
            ) {
                email {
                    edges {
                        node {
                            spf {
                                spfGuidanceTags
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
            "expected spf guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "spf3"
        in result["data"]["findDomainBySlug"]["email"]["edges"][0]["node"]["spf"][
            "spfGuidanceTags"
        ]
    )


def test_spf_guidance_tags_spf_3_dmarc(save):
    """
    Test that spf guidance tag spf 3 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Mail_scans(domain=test_domain)
    save(test_scan)

    test_spf_scan = Spf_scans(
        id=test_scan.id,
        spf_scan=spf_mock_data.get("spf_mock_data_spf3").get("spf_mock_data_spf3_spf"),
    )
    save(test_spf_scan)

    test_dmarc_scan = Dmarc_scans(
        id=test_scan.id,
        dmarc_scan=spf_mock_data.get("spf_mock_data_spf3").get(
            "spf_mock_data_spf3_dmarc"
        ),
    )
    save(test_dmarc_scan)

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
                urlSlug: "test-domain-ca"
            ) {
                email {
                    edges {
                        node {
                            spf {
                                spfGuidanceTags
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
            "expected spf guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "spf3"
        in result["data"]["findDomainBySlug"]["email"]["edges"][0]["node"]["spf"][
            "spfGuidanceTags"
        ]
    )


def test_spf_guidance_tags_spf_4(save):
    """
    Test that spf guidance tag spf 4 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Mail_scans(domain=test_domain)
    save(test_scan)

    test_spf_scan = Spf_scans(
        id=test_scan.id, spf_scan=spf_mock_data.get("spf_mock_data_spf4")
    )
    save(test_spf_scan)

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
                urlSlug: "test-domain-ca"
            ) {
                email {
                    edges {
                        node {
                            spf {
                                spfGuidanceTags
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
            "expected spf guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "spf4"
        in result["data"]["findDomainBySlug"]["email"]["edges"][0]["node"]["spf"][
            "spfGuidanceTags"
        ]
    )


def test_spf_guidance_tags_spf_5(save):
    """
    Test that spf guidance tag spf 5 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Mail_scans(domain=test_domain)
    save(test_scan)

    test_spf_scan = Spf_scans(
        id=test_scan.id, spf_scan=spf_mock_data.get("spf_mock_data_spf5")
    )
    save(test_spf_scan)

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
                urlSlug: "test-domain-ca"
            ) {
                email {
                    edges {
                        node {
                            spf {
                                spfGuidanceTags
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
            "expected spf guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "spf5"
        in result["data"]["findDomainBySlug"]["email"]["edges"][0]["node"]["spf"][
            "spfGuidanceTags"
        ]
    )


def test_spf_guidance_tags_spf_6(save):
    """
    Test that spf guidance tag spf 6 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Mail_scans(domain=test_domain)
    save(test_scan)

    test_spf_scan = Spf_scans(
        id=test_scan.id, spf_scan=spf_mock_data.get("spf_mock_data_spf6")
    )
    save(test_spf_scan)

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
                urlSlug: "test-domain-ca"
            ) {
                email {
                    edges {
                        node {
                            spf {
                                spfGuidanceTags
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
            "expected spf guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "spf6"
        in result["data"]["findDomainBySlug"]["email"]["edges"][0]["node"]["spf"][
            "spfGuidanceTags"
        ]
    )


def test_spf_guidance_tags_spf_7(save):
    """
    Test that spf guidance tag spf 7 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Mail_scans(domain=test_domain)
    save(test_scan)

    test_spf_scan = Spf_scans(
        id=test_scan.id, spf_scan=spf_mock_data.get("spf_mock_data_spf7")
    )
    save(test_spf_scan)

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
                urlSlug: "test-domain-ca"
            ) {
                email {
                    edges {
                        node {
                            spf {
                                spfGuidanceTags
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
            "expected spf guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "spf7"
        in result["data"]["findDomainBySlug"]["email"]["edges"][0]["node"]["spf"][
            "spfGuidanceTags"
        ]
    )


def test_spf_guidance_tags_spf_8(save):
    """
    Test that spf guidance tag spf 8 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Mail_scans(domain=test_domain)
    save(test_scan)

    test_spf_scan = Spf_scans(
        id=test_scan.id, spf_scan=spf_mock_data.get("spf_mock_data_spf8")
    )
    save(test_spf_scan)

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
                urlSlug: "test-domain-ca"
            ) {
                email {
                    edges {
                        node {
                            spf {
                                spfGuidanceTags
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
            "expected spf guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "spf8"
        in result["data"]["findDomainBySlug"]["email"]["edges"][0]["node"]["spf"][
            "spfGuidanceTags"
        ]
    )


def test_spf_guidance_tags_spf_9(save):
    """
    Test that spf guidance tag spf 9 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Mail_scans(domain=test_domain)
    save(test_scan)

    test_spf_scan = Spf_scans(
        id=test_scan.id, spf_scan=spf_mock_data.get("spf_mock_data_spf9")
    )
    save(test_spf_scan)

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
                urlSlug: "test-domain-ca"
            ) {
                email {
                    edges {
                        node {
                            spf {
                                spfGuidanceTags
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
            "expected spf guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "spf9"
        in result["data"]["findDomainBySlug"]["email"]["edges"][0]["node"]["spf"][
            "spfGuidanceTags"
        ]
    )


def test_spf_guidance_tags_spf_10(save):
    """
    Test that spf guidance tag spf 10 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Mail_scans(domain=test_domain)
    save(test_scan)

    test_spf_scan = Spf_scans(
        id=test_scan.id, spf_scan=spf_mock_data.get("spf_mock_data_spf10")
    )
    save(test_spf_scan)

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
                urlSlug: "test-domain-ca"
            ) {
                email {
                    edges {
                        node {
                            spf {
                                spfGuidanceTags
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
            "expected spf guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "spf10"
        in result["data"]["findDomainBySlug"]["email"]["edges"][0]["node"]["spf"][
            "spfGuidanceTags"
        ]
    )


def test_spf_guidance_tags_spf_11(save):
    """
    Test that spf guidance tag spf 11 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Mail_scans(domain=test_domain)
    save(test_scan)

    test_spf_scan = Spf_scans(
        id=test_scan.id, spf_scan=spf_mock_data.get("spf_mock_data_spf11")
    )
    save(test_spf_scan)

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
                urlSlug: "test-domain-ca"
            ) {
                email {
                    edges {
                        node {
                            spf {
                                spfGuidanceTags
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
            "expected spf guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "spf11"
        in result["data"]["findDomainBySlug"]["email"]["edges"][0]["node"]["spf"][
            "spfGuidanceTags"
        ]
    )


def test_spf_guidance_tags_spf_12(save):
    """
    Test that spf guidance tag spf 12 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Mail_scans(domain=test_domain)
    save(test_scan)

    test_spf_scan = Spf_scans(
        id=test_scan.id, spf_scan=spf_mock_data.get("spf_mock_data_spf12")
    )
    save(test_spf_scan)

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
                urlSlug: "test-domain-ca"
            ) {
                email {
                    edges {
                        node {
                            spf {
                                spfGuidanceTags
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
            "expected spf guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "spf12"
        in result["data"]["findDomainBySlug"]["email"]["edges"][0]["node"]["spf"][
            "spfGuidanceTags"
        ]
    )


def test_spf_guidance_tags_spf_13(save):
    """
    Test that spf guidance tag spf 13 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Mail_scans(domain=test_domain)
    save(test_scan)

    test_spf_scan = Spf_scans(
        id=test_scan.id, spf_scan=spf_mock_data.get("spf_mock_data_spf13")
    )
    save(test_spf_scan)

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
                urlSlug: "test-domain-ca"
            ) {
                email {
                    edges {
                        node {
                            spf {
                                spfGuidanceTags
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
            "expected spf guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "spf13"
        in result["data"]["findDomainBySlug"]["email"]["edges"][0]["node"]["spf"][
            "spfGuidanceTags"
        ]
    )
