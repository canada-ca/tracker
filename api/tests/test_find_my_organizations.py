import logging
import pytest

from pytest import fail

from db import DB
from models import Domains, Organizations, Users, User_affiliations
from tests.test_functions import json, run


@pytest.fixture()
def db():
    save, cleanup, session = DB()
    yield save, session
    cleanup()


def test_find_my_organizations_super_admin(db, caplog):
    """
    Test that a super admin receives all organizations no matter affiliations
    """
    save, _ = db

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

    caplog.set_level(logging.INFO)
    result = run(
        """
        {
            organizations: findMyOrganizations {
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
    assert (
        f"Super admin: {super_admin.id} successfully retrieved all organizations."
        in caplog.text
    )


def test_find_my_organizations_no_orgs_exist_super_admin(db, caplog):
    """
    Test tp make sure error occurs if no orgs are found
    """
    save, session = db

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

    session.query(Organizations).delete()
    session.commit()

    caplog.set_level(logging.WARNING)
    result = run(
        query="""
        {
            findMyOrganizations {
                edges {
                    node {
                        acronym
                    }
                }
            }
        }
        """,
        as_user=super_admin,
    )

    if "errors" not in result:
        fail(
            "Error occurred when trying to get organizations, error: {}".format(
                json(result)
            )
        )

    [error] = result["errors"]
    assert error["message"] == "Error, unable to find organizations."
    assert (
        f"User: {super_admin.id} tried to access all organizations, but does not have any affiliations."
        in caplog.text
    )


def test_find_my_organizations_admin(db, caplog):
    """
    Test that org admins only retrieve information that they are privy to
    """
    save, _ = db

    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1"
    )
    save(org_one)
    org_two = Organizations(
        acronym="ORG2", name="Organization 2", slug="organization-2"
    )
    save(org_two)

    admin = Users(
        display_name="testadmin",
        user_name="testadmin@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="admin", user_organization=org_one),
        ],
    )
    save(admin)

    caplog.set_level(logging.INFO)
    result = run(
        query="""
        {
            findMyOrganizations {
                edges {
                    node {
                        acronym
                    }
                }
            }
        }
        """,
        as_user=admin,
    )

    if "errors" in result:
        fail(
            "Error occurred when trying to get organizations, error: {}".format(
                json(result)
            )
        )

    expected_result = {
        "data": {
            "findMyOrganizations": {
                "edges": [
                    {"node": {"acronym": "ORG1"}},
                    {"node": {"acronym": "TESTADMIN-TESTEMAIL-CA"}},
                ]
            }
        }
    }

    assert result == expected_result
    assert (
        f"User: {admin.id} successfully retrieved all organizations that they belong to."
        in caplog.text
    )


def test_find_my_organizations_user_write(db, caplog):
    """
    Test that user write only retrieve information that they are privy to
    """
    save, _ = db

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

    caplog.set_level(logging.INFO)
    result = run(
        """
        {
            organizations: findMyOrganizations {
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
    assert (
        f"User: {user.id} successfully retrieved all organizations that they belong to."
        in caplog.text
    )


def test_find_my_organizations_user_read(db, caplog):
    """
    Test that user read only retrieve information that they are privy to
    """
    save, _ = db

    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1"
    )
    save(org_one)
    org_two = Organizations(
        acronym="ORG2", name="Organization 2", slug="organization-2"
    )
    save(org_two)

    reader = Users(
        display_name="testreader",
        user_name="testreader@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="admin", user_organization=org_one),
        ],
    )
    save(reader)

    caplog.set_level(logging.INFO)
    result = run(
        query="""
        {
            findMyOrganizations {
                edges {
                    node {
                        acronym
                    }
                }
            }
        }
        """,
        as_user=reader,
    )

    if "errors" in result:
        fail(
            "Error occurred when trying to get organizations, error: {}".format(
                json(result)
            )
        )

    expected_result = {
        "data": {
            "findMyOrganizations": {
                "edges": [
                    {"node": {"acronym": "ORG1"}},
                    {"node": {"acronym": "TESTREADER-TESTEMAIL-CA"}},
                ]
            }
        }
    }

    assert result == expected_result
    assert (
        f"User: {reader.id} successfully retrieved all organizations that they belong to."
        in caplog.text
    )
