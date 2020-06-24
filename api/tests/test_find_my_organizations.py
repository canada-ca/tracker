import logging
import pytest

from pytest import fail

from db import DB
from models import Organizations, Users, User_affiliations
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
                    {"node": {"acronym": "SA"}},
                    {"node": {"acronym": "TESTSUPERADMIN-TESTEMAIL-CA"}},
                ]
            }
        }
    }

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

    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1"
    )
    save(org_one)
    org_two = Organizations(
        acronym="ORG2", name="Organization 2", slug="organization-2"
    )
    save(org_two)

    writer = Users(
        display_name="testwriter",
        user_name="testwriter@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="admin", user_organization=org_one),
        ],
    )
    save(writer)

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
        as_user=writer,
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
                    {"node": {"acronym": "TESTWRITER-TESTEMAIL-CA"}},
                ]
            }
        }
    }

    assert result == expected_result
    assert (
        f"User: {writer.id} successfully retrieved all organizations that they belong to."
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
