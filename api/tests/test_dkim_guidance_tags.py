import pytest
from pytest import fail

from db import DB
from models import Users, Organizations, Domains, Mail_scans, Dkim_scans, User_affiliations
from tests.testdata.domain_guidance_tags import dkim_mock_data
from tests.test_functions import json, run


@pytest.fixture
def save():
    save, cleanup, session = DB()
    yield save
    cleanup()


def test_dkim_guidance_tags_dkim_2(save):
    """
    Test that dkim guidance tag dkim 2 shows up
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

    test_dkim_scan = Dkim_scans(
        id=test_scan.id, dkim_scan=dkim_mock_data.get("dkim_mock_data_dkim2")
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
                            dkim {
                                dkimGuidanceTags
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
            "expected dkim guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "dkim2"
        in result["data"]["domain"][0]["email"]["edges"][0]["node"]["dkim"][
            "dkimGuidanceTags"
        ]
    )


def test_dkim_guidance_tags_dkim_5(save):
    """
    Test that dkim guidance tag dkim 5 shows up
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

    test_dkim_scan = Dkim_scans(
        id=test_scan.id, dkim_scan=dkim_mock_data.get("dkim_mock_data_dkim5")
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
                            dkim {
                                dkimGuidanceTags
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
            "expected dkim guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "dkim5"
        in result["data"]["domain"][0]["email"]["edges"][0]["node"]["dkim"][
            "dkimGuidanceTags"
        ]
    )


def test_dkim_guidance_tags_dkim_6(save):
    """
    Test that dkim guidance tag dkim 6 shows up
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

    test_dkim_scan = Dkim_scans(
        id=test_scan.id, dkim_scan=dkim_mock_data.get("dkim_mock_data_dkim6")
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
                            dkim {
                                dkimGuidanceTags
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
            "expected dkim guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "dkim6"
        in result["data"]["domain"][0]["email"]["edges"][0]["node"]["dkim"][
            "dkimGuidanceTags"
        ]
    )


def test_dkim_guidance_tags_dkim_7(save):
    """
    Test that dkim guidance tag dkim 7 shows up
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

    test_dkim_scan = Dkim_scans(
        id=test_scan.id, dkim_scan=dkim_mock_data.get("dkim_mock_data_dkim7")
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
                            dkim {
                                dkimGuidanceTags
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
            "expected dkim guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "dkim7"
        in result["data"]["domain"][0]["email"]["edges"][0]["node"]["dkim"][
            "dkimGuidanceTags"
        ]
    )


def test_dkim_guidance_tags_dkim_8(save):
    """
    Test that dkim guidance tag dkim 8 shows up
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

    test_dkim_scan = Dkim_scans(
        id=test_scan.id, dkim_scan=dkim_mock_data.get("dkim_mock_data_dkim8")
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
                            dkim {
                                dkimGuidanceTags
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
            "expected dkim guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "dkim8"
        in result["data"]["domain"][0]["email"]["edges"][0]["node"]["dkim"][
            "dkimGuidanceTags"
        ]
    )


def test_dkim_guidance_tags_dkim_9(save):
    """
    Test that dkim guidance tag dkim 9 shows up
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

    test_dkim_scan = Dkim_scans(
        id=test_scan.id, dkim_scan=dkim_mock_data.get("dkim_mock_data_dkim9")
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
                            dkim {
                                dkimGuidanceTags
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
            "expected dkim guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "dkim9"
        in result["data"]["domain"][0]["email"]["edges"][0]["node"]["dkim"][
            "dkimGuidanceTags"
        ]
    )


def test_dkim_guidance_tags_dkim_10(save):
    """
    Test that dkim guidance tag dkim 10 shows up
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

    test_dkim_scan = Dkim_scans(
        id=test_scan.id, dkim_scan=dkim_mock_data.get("dkim_mock_data_dkim10")
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
                            dkim {
                                dkimGuidanceTags
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
            "expected dkim guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "dkim10"
        in result["data"]["domain"][0]["email"]["edges"][0]["node"]["dkim"][
            "dkimGuidanceTags"
        ]
    )


def test_dkim_guidance_tags_dkim_11(save):
    """
    Test that dkim guidance tag dkim 11 shows up
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

    test_dkim_scan = Dkim_scans(
        id=test_scan.id, dkim_scan=dkim_mock_data.get("dkim_mock_data_dkim11")
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
                            dkim {
                                dkimGuidanceTags
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
            "expected dkim guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "dkim11"
        in result["data"]["domain"][0]["email"]["edges"][0]["node"]["dkim"][
            "dkimGuidanceTags"
        ]
    )


def test_dkim_guidance_tags_dkim_12(save):
    """
    Test that dkim guidance tag dkim 12 shows up
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

    test_dkim_scan = Dkim_scans(
        id=test_scan.id, dkim_scan=dkim_mock_data.get("dkim_mock_data_dkim12")
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
                            dkim {
                                dkimGuidanceTags
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
            "expected dkim guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "dkim12"
        in result["data"]["domain"][0]["email"]["edges"][0]["node"]["dkim"][
            "dkimGuidanceTags"
        ]
    )


def test_dkim_guidance_tags_dkim_13(save):
    """
    Test that dkim guidance tag dkim 13 shows up
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

    test_dkim_scan = Dkim_scans(
        id=test_scan.id, dkim_scan=dkim_mock_data.get("dkim_mock_data_dkim13")
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
                            dkim {
                                dkimGuidanceTags
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
            "expected dkim guidance tags to be returned. Instead:"
            "{}".format(json(result))
        )

    assert (
        "dkim13"
        in result["data"]["domain"][0]["email"]["edges"][0]["node"]["dkim"][
            "dkimGuidanceTags"
        ]
    )
