import logging
import pytest

from pytest import fail

from db import DB
from models import (
    Organizations,
    Users,
    User_affiliations,
)
from tests.test_functions import json, run


@pytest.fixture
def save():
    s, cleanup, session = DB()
    yield s
    cleanup()


# Super Admin Tests
def test_super_admin_can_see_any_user_list(save, caplog):
    """
    Test to see if super admins can view user list of different org
    """
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
            )
        ],
    )
    save(super_admin)

    reader = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(
                permission="user_read",
                user_organization=Organizations(
                    acronym="ORG1", name="Organization 1", slug="organization-1"
                ),
            )
        ],
    )
    save(reader)

    caplog.set_level(logging.INFO)
    result = run(
        query="""
          {
            userList(orgSlug: "organization-1") {
              edges {
                node {
                  userName
                  displayName
                  tfa
                  admin
                }
              }
            }
          }
        """,
        as_user=super_admin,
    )

    if "errors" in result:
        fail("Expected to get user details. Instead: {}".format(json(result)))

    expected = {
        "data": {
            "userList": {
                "edges": [
                    {
                        "node": {
                            "userName": "testuserread@testemail.ca",
                            "displayName": "testuserread",
                            "tfa": False,
                            "admin": False,
                        }
                    }
                ]
            }
        }
    }

    assert result == expected
    assert (
        f"User: {super_admin.id} successfully retrieved user list for organization-1."
        in caplog.text
    )


def test_super_admin_cant_see_user_list_for_org_doesnt_exist(save, caplog):
    """
    Test to error occurs when super admin requests an org that doesn't exist
    """
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
            )
        ],
    )
    save(super_admin)

    caplog.set_level(logging.WARNING)
    result = run(
        """
        {
            userList(orgSlug: "organization-2") {
                edges {
                    node {
                        userName
                        displayName
                        tfa
                        admin
                    }
                }
            }
        }
        """,
        as_user=super_admin,
    )

    if "errors" not in result:
        fail("Expected to get an error. Instead: {}".format(json(result)))

    [error] = result["errors"]
    assert error["message"] == "Error, unable to access user list."
    assert (
        f"User: {super_admin.id} tried to access user list for org organization-2 but org does not exist."
        in caplog.text
    )


# Admin Tests
def test_admin_can_see_user_list_in_same_org(save, caplog):
    """
    Test to see if admin can view user list of same org
    """
    org_one = Organizations(acronym="ORG1", name="Organization 1")
    save(org_one)
    admin_user = Users(
        display_name="testadmin",
        user_name="testadmin@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
    )
    admin_user.user_affiliation.append(
        User_affiliations(permission="super_admin", user_organization=org_one,)
    )
    save(admin_user)

    user_read = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
    )
    user_read.user_affiliation.append(
        User_affiliations(permission="user_read", user_organization=org_one,)
    )
    save(user_read)

    caplog.set_level(logging.INFO)
    result = run(
        query="""
        {
          userList(orgSlug: "organization-1") {
            edges {
              node {
                userName
                displayName
                tfa
                admin
              }
            }
          }
        }
        """,
        as_user=admin_user,
    )

    if "errors" in result:
        fail("Expected to get user details. Instead: {}".format(json(result)))

    expected = {
        "data": {
            "userList": {
                "edges": [
                    {
                        "node": {
                            "userName": "testadmin@testemail.ca",
                            "displayName": "testadmin",
                            "tfa": False,
                            "admin": True,
                        }
                    },
                    {
                        "node": {
                            "userName": "testuserread@testemail.ca",
                            "displayName": "testuserread",
                            "tfa": False,
                            "admin": False,
                        }
                    },
                ]
            }
        }
    }
    expected_2 = {
        "data": {
            "userList": {
                "edges": [
                    {
                        "node": {
                            "userName": "testuserread@testemail.ca",
                            "displayName": "testuserread",
                            "tfa": False,
                            "admin": False,
                        }
                    },
                    {
                        "node": {
                            "userName": "testadmin@testemail.ca",
                            "displayName": "testadmin",
                            "tfa": False,
                            "admin": True,
                        }
                    },
                ]
            }
        }
    }

    assert result == (expected or expected_2)
    assert (
        f"User: {admin_user.id} successfully retrieved user list for organization-1."
        in caplog.text
    )


def test_admin_cant_see_user_list_in_different_org(save, caplog):
    """
    Test to see if admin cant view user list of different org
    """
    org_one = Organizations(acronym="ORG1", name="Organization 1")
    save(org_one)
    org_two = Organizations(acronym="ORG2", name="Organization 2")
    save(org_two)
    admin_user = Users(
        display_name="testadmin",
        user_name="testadmin@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
    )
    admin_user.user_affiliation.append(
        User_affiliations(permission="admin", user_organization=org_one,)
    )
    save(admin_user)

    user_read = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
    )
    user_read.user_affiliation.append(
        User_affiliations(permission="user_read", user_organization=org_two,)
    )
    save(user_read)

    caplog.set_level(logging.WARNING)
    result = run(
        """
        {
            userList(orgSlug: "organization-2") {
                edges {
                    node {
                        userName
                        displayName
                        tfa
                        admin
                    }
                }
            }
        }
        """,
        as_user=admin_user,
    )

    if "errors" not in result:
        fail("Expected to get an error. Instead: {}".format(json(result)))

    [error] = result["errors"]
    assert error["message"] == "Error, unable to access user list."
    assert (
        f"User: {admin_user.id} tried to access user list for organization-2 but does not have access to org."
        in caplog.text
    )


def test_admin_cant_see_user_list_for_org_doesnt_exist(save, caplog):
    """
    Test to error occurs when admin requests an org that doesn't exist
    """
    org_one = Organizations(acronym="ORG1", name="Organization 1")
    save(org_one)

    admin_user = Users(
        display_name="testadmin",
        user_name="testadmin@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
    )
    admin_user.user_affiliation.append(
        User_affiliations(permission="admin", user_organization=org_one,)
    )
    save(admin_user)

    caplog.set_level(logging.WARNING)
    result = run(
        """
        {
            userList(orgSlug: "organization-2") {
                edges {
                    node {
                        userName
                        displayName
                        tfa
                        admin
                    }
                }
            }
        }
        """,
        as_user=admin_user,
    )

    if "errors" not in result:
        fail("Expected to get an error. Instead: {}".format(json(result)))

    [error] = result["errors"]
    assert error["message"] == "Error, unable to access user list."
    assert (
        f"User: {admin_user.id} tried to access user list for org organization-2 but org does not exist."
        in caplog.text
    )


# User Write Tests
def test_user_write_cant_see_user_list(save, caplog):
    """
    Test to see if user write cant view user list of any org
    """
    org_one = Organizations(acronym="ORG1", name="Organization 1")
    save(org_one)
    org_two = Organizations(acronym="ORG2", name="Organization 2")
    save(org_two)
    user_write = Users(
        display_name="testuserwrite",
        user_name="testuserwrite@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
    )
    user_write.user_affiliation.append(
        User_affiliations(permission="user_write", user_organization=org_one,)
    )
    save(user_write)

    user_read = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
    )
    user_read.user_affiliation.append(
        User_affiliations(permission="user_read", user_organization=org_two,)
    )
    save(user_read)

    caplog.set_level(logging.WARNING)
    result = run(
        query="""
        {
            userList(orgSlug: "organization-2") {
                edges {
                    node {
                        userName
                        displayName
                        tfa
                        admin
                    }
                }
            }
        }
        """,
        as_user=user_write,
    )

    if "errors" not in result:
        fail(
            "Expected to get an error. Instead: {}".format(json.dumps(result, indent=2))
        )

    [error] = result["errors"]
    assert error["message"] == "Error, unable to access user list."
    assert (
        f"User: {user_write.id} tried to access user list for organization-2 but does not have access to org."
        in caplog.text
    )


# User Read Tests
def test_user_read_cant_see_user_list(save, caplog):
    """
    Test to see if user Read cant view user list of any org
    """
    org1_reader = Users(
        display_name="testuserread1",
        user_name="testuserread1@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        user_affiliation=[
            User_affiliations(
                permission="user_read",
                user_organization=Organizations(acronym="ORG1", name="Organization 1"),
            )
        ],
    )
    save(org1_reader)

    org2_reader = Users(
        display_name="testuserread2",
        user_name="testuserread2@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        user_affiliation=[
            User_affiliations(
                permission="user_read",
                user_organization=Organizations(acronym="ORG2", name="Organization 2"),
            )
        ],
    )
    save(org2_reader)

    caplog.set_level(logging.WARNING)
    result = run(
        as_user=org1_reader,
        query="""
        {
            userList(orgSlug: "organization-2") {
                edges {
                    node {
                        userName
                        displayName
                        tfa
                        admin
                    }
                }
            }
        }
        """,
    )

    if "errors" not in result:
        fail("Expected to get an error. Instead: {}".format(json(result)))

    [err] = result["errors"]
    [message, _location, _path] = err.values()
    assert message == "Error, unable to access user list."
    assert (
        f"User: {org1_reader.id} tried to access user list for organization-2 but does not have access to org."
        in caplog.text
    )
