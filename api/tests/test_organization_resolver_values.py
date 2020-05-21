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


def test_get_org_resolvers_by_org_super_admin_single_node(save):
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

    result = run(
        """
        {
            organization(slug: "organization-1") {
                edges {
                    node {
                        acronym
                        name
                        slug
                        zone
                        sector
                        province
                        city
                        domains {
                            edges {
                                node {
                                    url
                                }
                            }
                        }
                        affiliatedUsers {
                            edges {
                                node {
                                    user {
                                        displayName
                                    }
                                    permission
                                }
                            }
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
                "edges": [
                    {
                        "node": {
                            "acronym": "ORG1",
                            "name": "Organization 1",
                            "slug": "organization-1",
                            "zone": "Prov",
                            "sector": "Banking",
                            "province": "Alberta",
                            "city": "Calgary",
                            "domains": {
                                "edges": [{"node": {"url": "somecooldomain.ca"}}]
                            },
                            "affiliatedUsers": {
                                "edges": [
                                    {
                                        "node": {
                                            "user": {"displayName": "testsuperadmin"},
                                            "permission": "SUPER_ADMIN",
                                        }
                                    },
                                    {
                                        "node": {
                                            "user": {"displayName": "testuserread"},
                                            "permission": "USER_READ",
                                        }
                                    },
                                ]
                            },
                        }
                    }
                ]
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


def test_get_org_resolvers_super_admin_multi_node(save):
    """
    Test organization resolver as a super admin, multi node return with
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
    org3 = Organizations(
        acronym="ORG3",
        domains=[Domains(domain="somelamedomain.ca")],
        name="Organization 3",
        org_tags={
            "zone": "Federal",
            "sector": "Arts",
            "province": "Ontario",
            "city": "Toronto",
        },
    )
    save(org3)
    user = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org1, permission="user_read"),

        ],
    )
    user.verify_account()
    save(user)

    super_admin = Users(
        display_name="testsuperadmin",
        user_name="testsuperadmin@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org1, permission="super_admin"),
        ],
    )
    super_admin.verify_account()
    save(super_admin)

    result = run(
        """
        {
            organizations {
                edges {
                    node {
                        acronym
                        name
                        slug
                        zone
                        sector
                        province
                        city
                        domains {
                            edges {
                                node {
                                    url
                                }
                            }
                        }
                        affiliatedUsers {
                            edges {
                                node {
                                    user {
                                        displayName
                                    }
                                    permission
                                }
                            }
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
            "organizations": {
                "edges": [
                    {
                        "node": {
                            "acronym": "ORG1",
                            "name": "Organization 1",
                            "slug": "organization-1",
                            "zone": "Prov",
                            "sector": "Banking",
                            "province": "Alberta",
                            "city": "Calgary",
                            "domains": {
                                "edges": [{"node": {"url": "somecooldomain.ca"}}]
                            },
                            "affiliatedUsers": {
                                "edges": [
                                    {
                                        "node": {
                                            "user": {"displayName": "testuserread"},
                                            "permission": "USER_READ",
                                        }
                                    },
                                    {
                                        "node": {
                                            "user": {"displayName": "testsuperadmin"},
                                            "permission": "SUPER_ADMIN",
                                        }
                                    },
                                ]
                            },
                        }
                    },
                    {
                        "node": {
                            "acronym": "ORG2",
                            "name": "Organization 2",
                            "slug": "organization-2",
                            "zone": "Muni",
                            "sector": "Transportation",
                            "province": "NS",
                            "city": "Halifax",
                            "domains": {
                                "edges": [{"node": {"url": "anothercooldomain.ca"}}]
                            },
                            "affiliatedUsers": {"edges": []},
                        }
                    },
                    {
                        "node": {
                            "acronym": "ORG3",
                            "name": "Organization 3",
                            "slug": "organization-3",
                            "zone": "Federal",
                            "sector": "Arts",
                            "province": "Ontario",
                            "city": "Toronto",
                            "domains": {
                                "edges": [{"node": {"url": "somelamedomain.ca"}}]
                            },
                            "affiliatedUsers": {"edges": []},
                        }
                    },
                    {
                        "node": {
                            "acronym": "TESTUSERREAD-TESTEMAIL-CA",
                            "name": "testuserread@testemail.ca",
                            "slug": "testuserread-testemail-ca",
                            "zone": None,
                            "sector": None,
                            "province": None,
                            "city": None,
                            "domains": {"edges": []},
                            "affiliatedUsers": {
                                "edges": [
                                    {
                                        "node": {
                                            "user": {"displayName": "testuserread"},
                                            "permission": "ADMIN",
                                        }
                                    }
                                ]
                            },
                        }
                    },
                    {
                        "node": {
                            "acronym": "TESTSUPERADMIN-TESTEMAIL-CA",
                            "name": "testsuperadmin@testemail.ca",
                            "slug": "testsuperadmin-testemail-ca",
                            "zone": None,
                            "sector": None,
                            "province": None,
                            "city": None,
                            "domains": {"edges": []},
                            "affiliatedUsers": {
                                "edges": [
                                    {
                                        "node": {
                                            "user": {"displayName": "testsuperadmin"},
                                            "permission": "ADMIN",
                                        }
                                    }
                                ]
                            },
                        }
                    },
                ]
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


# User read tests
def test_get_org_resolvers_by_org_user_read_single_node(save):
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

    result = run(
        """
        {
            organization(slug: "organization-1") {
                edges {
                    node {
                        acronym
                        name
                        slug
                        zone
                        sector
                        province
                        city
                        domains {
                            edges {
                                node {
                                    url
                                }
                            }
                        }
                        affiliatedUsers {
                            edges {
                                node {
                                    user {
                                        displayName
                                    }
                                    permission
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

    expected_result = {
        "data": {
            "organization": {
                "edges": [
                    {
                        "node": {
                            "acronym": "ORG1",
                            "name": "Organization 1",
                            "slug": "organization-1",
                            "zone": "Prov",
                            "sector": "Banking",
                            "province": "Alberta",
                            "city": "Calgary",
                            "domains": {
                                "edges": [{"node": {"url": "somecooldomain.ca"}}]
                            },
                            "affiliatedUsers": {"edges": []},
                        }
                    }
                ]
            }
        }
    }

    assert result == expected_result


def test_get_org_resolvers_by_org_user_read_multi_node(save):
    """
    Test organizations resolver as a user read, multi node return with
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
    user = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org1, permission="user_read"),

        ],
    )
    user.verify_account()
    save(user)

    result = run(
        """
        {
            organizations {
                edges {
                    node {
                        acronym
                        name
                        slug
                        zone
                        sector
                        province
                        city
                        domains {
                            edges {
                                node {
                                    url
                                }
                            }
                        }
                        affiliatedUsers {
                            edges {
                                node {
                                    user {
                                        displayName
                                    }
                                    permission
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
    expected_result = {
        "data": {
            "organizations": {
                "edges": [
                    {
                        "node": {
                            "acronym": "ORG1",
                            "name": "Organization 1",
                            "slug": "organization-1",
                            "zone": "Prov",
                            "sector": "Banking",
                            "province": "Alberta",
                            "city": "Calgary",
                            "domains": {
                                "edges": [{"node": {"url": "somecooldomain.ca"}}]
                            },
                            "affiliatedUsers": {"edges": []},
                        }
                    },
                    {
                        "node": {
                            "acronym": "TESTUSERREAD-TESTEMAIL-CA",
                            "name": "testuserread@testemail.ca",
                            "slug": "testuserread-testemail-ca",
                            "zone": None,
                            "sector": None,
                            "province": None,
                            "city": None,
                            "domains": {"edges": []},
                            "affiliatedUsers": {
                                "edges": [
                                    {
                                        "node": {
                                            "user": {"displayName": "testuserread"},
                                            "permission": "ADMIN",
                                        }
                                    }
                                ]
                            },
                        }
                    },
                ]
            }
        }
    }

    if "errors" in result:
        fail("Expect success but errors were returned: {}".format(result["errors"]))
    assert result == expected_result
