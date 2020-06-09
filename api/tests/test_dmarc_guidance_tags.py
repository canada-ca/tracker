import pytest
from pytest import fail

from db import DB
from models import Users, Organizations, Domains, Scans, Dmarc_scans, User_affiliations
from tests.testdata.domain_guidance_tags import dmarc_mock_data
from tests.test_functions import json, run


@pytest.fixture
def save():
    save, cleanup, session = DB()
    yield save
    cleanup()


def test_dkim_guidance_tags_dmarc_2(save):
    """
    Test that dmarc guidance tag dmarc 2 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Scans(domain=test_domain)
    save(test_scan)

    test_dmarc_scan = Dmarc_scans(
        id=test_scan.id, dmarc_scan=dmarc_mock_data.get("dmarc_mock_data_dmarc2")
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
            domain(
                urlSlug: "test-domain-ca"
            ) {
                email {
                    edges {
                        node {
                            dmarc {
                                dmarcGuidanceTags {
                                    value
                                }
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
            "expected dmarc guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "{'dmarc2': 'DMARC-missing'}"
        in result["data"]["domain"][0]["email"]["edges"][0]["node"]["dmarc"][
            "dmarcGuidanceTags"
        ]["value"]
    )


def test_dkim_guidance_tags_dmarc_3(save):
    """
    Test that dmarc guidance tag dmarc 3 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Scans(domain=test_domain)
    save(test_scan)

    test_dkim_scan = Dmarc_scans(
        id=test_scan.id, dmarc_scan=dmarc_mock_data.get("dmarc_mock_data_dmarc3")
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
            domain(
                urlSlug: "test-domain-ca"
            ) {
                email {
                    edges {
                        node {
                            dmarc {
                                dmarcGuidanceTags {
                                    value
                                }
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
            "expected dmarc guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "{'dmarc3': 'P-missing'}"
        in result["data"]["domain"][0]["email"]["edges"][0]["node"]["dmarc"][
            "dmarcGuidanceTags"
        ]["value"]
    )


def test_dkim_guidance_tags_dmarc_4(save):
    """
    Test that dmarc guidance tag dmarc 4 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Scans(domain=test_domain)
    save(test_scan)

    test_dkim_scan = Dmarc_scans(
        id=test_scan.id, dmarc_scan=dmarc_mock_data.get("dmarc_mock_data_dmarc4")
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
            domain(
                urlSlug: "test-domain-ca"
            ) {
                email {
                    edges {
                        node {
                            dmarc {
                                dmarcGuidanceTags {
                                    value
                                }
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
            "expected dmarc guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "{'dmarc4': 'P-none'}"
        in result["data"]["domain"][0]["email"]["edges"][0]["node"]["dmarc"][
            "dmarcGuidanceTags"
        ]["value"]
    )


def test_dkim_guidance_tags_dmarc_5(save):
    """
    Test that dmarc guidance tag dmarc 5 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Scans(domain=test_domain)
    save(test_scan)

    test_dkim_scan = Dmarc_scans(
        id=test_scan.id, dmarc_scan=dmarc_mock_data.get("dmarc_mock_data_dmarc5")
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
            domain(
                urlSlug: "test-domain-ca"
            ) {
                email {
                    edges {
                        node {
                            dmarc {
                                dmarcGuidanceTags {
                                    value
                                }
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
            "expected dmarc guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "{'dmarc5': 'P-quarantine'}"
        in result["data"]["domain"][0]["email"]["edges"][0]["node"]["dmarc"][
            "dmarcGuidanceTags"
        ]["value"]
    )


def test_dkim_guidance_tags_dmarc_6(save):
    """
    Test that dmarc guidance tag dmarc 6 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Scans(domain=test_domain)
    save(test_scan)

    test_dkim_scan = Dmarc_scans(
        id=test_scan.id, dmarc_scan=dmarc_mock_data.get("dmarc_mock_data_dmarc6")
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
            domain(
                urlSlug: "test-domain-ca"
            ) {
                email {
                    edges {
                        node {
                            dmarc {
                                dmarcGuidanceTags {
                                    value
                                }
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
            "expected dmarc guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "{'dmarc6': 'P-reject'}"
        in result["data"]["domain"][0]["email"]["edges"][0]["node"]["dmarc"][
            "dmarcGuidanceTags"
        ]["value"]
    )


def test_dkim_guidance_tags_dmarc_7(save):
    """
    Test that dmarc guidance tag dmarc 7 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Scans(domain=test_domain)
    save(test_scan)

    test_dkim_scan = Dmarc_scans(
        id=test_scan.id, dmarc_scan=dmarc_mock_data.get("dmarc_mock_data_dmarc7")
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
            domain(
                urlSlug: "test-domain-ca"
            ) {
                email {
                    edges {
                        node {
                            dmarc {
                                dmarcGuidanceTags {
                                    value
                                }
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
            "expected dmarc guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "{'dmarc7': 'PCT-100'}"
        in result["data"]["domain"][0]["email"]["edges"][0]["node"]["dmarc"][
            "dmarcGuidanceTags"
        ]["value"]
    )


def test_dkim_guidance_tags_dmarc_8(save):
    """
    Test that dmarc guidance tag dmarc 7 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Scans(domain=test_domain)
    save(test_scan)

    test_dkim_scan = Dmarc_scans(
        id=test_scan.id, dmarc_scan=dmarc_mock_data.get("dmarc_mock_data_dmarc8")
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
            domain(
                urlSlug: "test-domain-ca"
            ) {
                email {
                    edges {
                        node {
                            dmarc {
                                dmarcGuidanceTags {
                                    value
                                }
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
            "expected dmarc guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "{'dmarc8': 'PCT-80'}"
        in result["data"]["domain"][0]["email"]["edges"][0]["node"]["dmarc"][
            "dmarcGuidanceTags"
        ]["value"]
    )


def test_dkim_guidance_tags_dmarc_9(save):
    """
    Test that dmarc guidance tag dmarc 9 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Scans(domain=test_domain)
    save(test_scan)

    test_dkim_scan = Dmarc_scans(
        id=test_scan.id, dmarc_scan=dmarc_mock_data.get("dmarc_mock_data_dmarc9")
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
            domain(
                urlSlug: "test-domain-ca"
            ) {
                email {
                    edges {
                        node {
                            dmarc {
                                dmarcGuidanceTags {
                                    value
                                }
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
            "expected dmarc guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "{'dmarc9': 'PCT-invalid'}"
        in result["data"]["domain"][0]["email"]["edges"][0]["node"]["dmarc"][
            "dmarcGuidanceTags"
        ]["value"]
    )


def test_dkim_guidance_tags_dmarc_10_dmarc_11(save):
    """
    Test that dmarc guidance tag dmarc 10, dmarc 11 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Scans(domain=test_domain)
    save(test_scan)

    test_dkim_scan = Dmarc_scans(
        id=test_scan.id,
        dmarc_scan=dmarc_mock_data.get("dmarc_mock_data_dmarc10_dmarc_11"),
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
            domain(
                urlSlug: "test-domain-ca"
            ) {
                email {
                    edges {
                        node {
                            dmarc {
                                dmarcGuidanceTags {
                                    value
                                }
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
            "expected dmarc guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "{'dmarc10': 'RUA-CCCS'}"
        in result["data"]["domain"][0]["email"]["edges"][0]["node"]["dmarc"][
            "dmarcGuidanceTags"
        ]["value"]
    )
    assert (
        "{'dmarc11': 'RUF-CCCS'}"
        in result["data"]["domain"][0]["email"]["edges"][0]["node"]["dmarc"][
            "dmarcGuidanceTags"
        ]["value"]
    )


def test_dkim_guidance_tags_dmarc_12_dmarc_13(save):
    """
    Test that dmarc guidance tag dmarc 12, dmarc 13 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Scans(domain=test_domain)
    save(test_scan)

    test_dkim_scan = Dmarc_scans(
        id=test_scan.id,
        dmarc_scan=dmarc_mock_data.get("dmarc_mock_data_dmarc12_dmarc_13"),
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
            domain(
                urlSlug: "test-domain-ca"
            ) {
                email {
                    edges {
                        node {
                            dmarc {
                                dmarcGuidanceTags {
                                    value
                                }
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
            "expected dmarc guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "{'dmarc12': 'RUA-none'}"
        in result["data"]["domain"][0]["email"]["edges"][0]["node"]["dmarc"][
            "dmarcGuidanceTags"
        ]["value"]
    )
    assert (
        "{'dmarc13': 'RUF-none'}"
        in result["data"]["domain"][0]["email"]["edges"][0]["node"]["dmarc"][
            "dmarcGuidanceTags"
        ]["value"]
    )


def test_dkim_guidance_tags_dmarc_14(save):
    """
    Test that dmarc guidance tag dmarc 14 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Scans(domain=test_domain)
    save(test_scan)

    test_dkim_scan = Dmarc_scans(
        id=test_scan.id, dmarc_scan=dmarc_mock_data.get("dmarc_mock_data_dmarc14")
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
            domain(
                urlSlug: "test-domain-ca"
            ) {
                email {
                    edges {
                        node {
                            dmarc {
                                dmarcGuidanceTags {
                                    value
                                }
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
            "expected dmarc guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "{'dmarc14': 'TXT-DMARC-enabled'}"
        in result["data"]["domain"][0]["email"]["edges"][0]["node"]["dmarc"][
            "dmarcGuidanceTags"
        ]["value"]
    )


def test_dkim_guidance_tags_dmarc_15(save):
    """
    Test that dmarc guidance tag dmarc 15 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Scans(domain=test_domain)
    save(test_scan)

    test_dkim_scan = Dmarc_scans(
        id=test_scan.id, dmarc_scan=dmarc_mock_data.get("dmarc_mock_data_dmarc15")
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
            domain(
                urlSlug: "test-domain-ca"
            ) {
                email {
                    edges {
                        node {
                            dmarc {
                                dmarcGuidanceTags {
                                    value
                                }
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
            "expected dmarc guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "{'dmarc15': 'TXT-DMARC-missing'}"
        in result["data"]["domain"][0]["email"]["edges"][0]["node"]["dmarc"][
            "dmarcGuidanceTags"
        ]["value"]
    )


def test_dkim_guidance_tags_dmarc_16(save):
    """
    Test that dmarc guidance tag dmarc 16 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Scans(domain=test_domain)
    save(test_scan)

    test_dkim_scan = Dmarc_scans(
        id=test_scan.id, dmarc_scan=dmarc_mock_data.get("dmarc_mock_data_dmarc16")
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
            domain(
                urlSlug: "test-domain-ca"
            ) {
                email {
                    edges {
                        node {
                            dmarc {
                                dmarcGuidanceTags {
                                    value
                                }
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
            "expected dmarc guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "{'dmarc16': 'SP-missing'}"
        in result["data"]["domain"][0]["email"]["edges"][0]["node"]["dmarc"][
            "dmarcGuidanceTags"
        ]["value"]
    )


def test_dkim_guidance_tags_dmarc_17(save):
    """
    Test that dmarc guidance tag dmarc 17 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Scans(domain=test_domain)
    save(test_scan)

    test_dkim_scan = Dmarc_scans(
        id=test_scan.id, dmarc_scan=dmarc_mock_data.get("dmarc_mock_data_dmarc17")
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
            domain(
                urlSlug: "test-domain-ca"
            ) {
                email {
                    edges {
                        node {
                            dmarc {
                                dmarcGuidanceTags {
                                    value
                                }
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
            "expected dmarc guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "{'dmarc17': 'SP-none'}"
        in result["data"]["domain"][0]["email"]["edges"][0]["node"]["dmarc"][
            "dmarcGuidanceTags"
        ]["value"]
    )


def test_dkim_guidance_tags_dmarc_18(save):
    """
    Test that dmarc guidance tag dmarc 18 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Scans(domain=test_domain)
    save(test_scan)

    test_dkim_scan = Dmarc_scans(
        id=test_scan.id, dmarc_scan=dmarc_mock_data.get("dmarc_mock_data_dmarc18")
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
            domain(
                urlSlug: "test-domain-ca"
            ) {
                email {
                    edges {
                        node {
                            dmarc {
                                dmarcGuidanceTags {
                                    value
                                }
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
            "expected dmarc guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "{'dmarc18': 'SP-quarantine'}"
        in result["data"]["domain"][0]["email"]["edges"][0]["node"]["dmarc"][
            "dmarcGuidanceTags"
        ]["value"]
    )


def test_dkim_guidance_tags_dmarc_19(save):
    """
    Test that dmarc guidance tag dmarc 19 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Scans(domain=test_domain)
    save(test_scan)

    test_dkim_scan = Dmarc_scans(
        id=test_scan.id, dmarc_scan=dmarc_mock_data.get("dmarc_mock_data_dmarc19")
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
            domain(
                urlSlug: "test-domain-ca"
            ) {
                email {
                    edges {
                        node {
                            dmarc {
                                dmarcGuidanceTags {
                                    value
                                }
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
            "expected dmarc guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "{'dmarc19': 'SP-reject'}"
        in result["data"]["domain"][0]["email"]["edges"][0]["node"]["dmarc"][
            "dmarcGuidanceTags"
        ]["value"]
    )


def test_dkim_guidance_tags_dmarc_20(save):
    """
    Test that dmarc guidance tag dmarc 20 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Scans(domain=test_domain)
    save(test_scan)

    test_dkim_scan = Dmarc_scans(
        id=test_scan.id, dmarc_scan=dmarc_mock_data.get("dmarc_mock_data_dmarc20")
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
            domain(
                urlSlug: "test-domain-ca"
            ) {
                email {
                    edges {
                        node {
                            dmarc {
                                dmarcGuidanceTags {
                                    value
                                }
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
            "expected dmarc guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "{'dmarc20': 'PCT-none-exists'}"
        in result["data"]["domain"][0]["email"]["edges"][0]["node"]["dmarc"][
            "dmarcGuidanceTags"
        ]["value"]
    )


def test_dkim_guidance_tags_dmarc_21(save):
    """
    Test that dmarc guidance tag dmarc 21 shows up
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1",
    )
    save(org_one)

    test_domain = Domains(
        organization=org_one, domain="test.domain.ca", slug="test-domain-ca"
    )
    save(test_domain)

    test_scan = Scans(domain=test_domain)
    save(test_scan)

    test_dkim_scan = Dmarc_scans(
        id=test_scan.id, dmarc_scan=dmarc_mock_data.get("dmarc_mock_data_dmarc21")
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
            domain(
                urlSlug: "test-domain-ca"
            ) {
                email {
                    edges {
                        node {
                            dmarc {
                                dmarcGuidanceTags {
                                    value
                                }
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
            "expected dmarc guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "{'dmarc21': 'PCT-0'}"
        in result["data"]["domain"][0]["email"]["edges"][0]["node"]["dmarc"][
            "dmarcGuidanceTags"
        ]["value"]
    )
