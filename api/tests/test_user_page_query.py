import pytest

from pytest import fail

from app import app
from db import DB
from models import (
    Organizations,
    Users,
    User_affiliations,
)
from tests.test_functions import json, run


@pytest.fixture
def save():
    with app.app_context():
        s, cleanup, session = DB()
        yield s
        cleanup()


# Super Admin Tests
def test_super_admin_can_see_other_user_in_different_org(save):
    """
    Test to see if a super admin can see their other users userPage info
    """
    sa_user = Users(
        display_name="testsuperadmin",
        user_name="testsuperadmin@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
    )
    sa_user.user_affiliation.append(
        User_affiliations(
            permission="super_admin",
            user_organization=Organizations(
                acronym="SA", name="Super Admin", slug="super-admin"
            ),
        )
    )
    save(sa_user)

    user_read = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
    )
    user_read.user_affiliation.append(
        User_affiliations(
            permission="user_read",
            user_organization=Organizations(
                acronym="ORG1", name="Organization 1", slug="organization-1"
            ),
        )
    )
    user_read.verify_account()
    save(user_read)

    result = run(
        query="""
        {
            userPage(userName: "testuserread@testemail.ca") {
                userName
                displayName
                lang
                tfa
                userAffiliations {
                    admin
                    organization
                }
            }
        }
        """,
        as_user=sa_user,
    )

    if "errors" in result:
        fail("Expected to get user details. Instead: {}".format(json(result)))

    expected = {
        "data": {
            "userPage": {
                "userName": "testuserread@testemail.ca",
                "displayName": "testuserread",
                "lang": "English",
                "tfa": False,
                "userAffiliations": [
                    {"admin": False, "organization": "ORG1"},
                    {"admin": True, "organization": "TESTUSERREAD-TESTEMAIL-CA"},
                ],
            }
        }
    }

    assert result == expected


# Admin Tests
def test_admin_can_see_user_in_same_org(save):
    """
    Test to see that an admin can see user information from their own org
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1"
    )
    save(org_one)
    admin_user = Users(
        display_name="testsuperadmin",
        user_name="testsuperadmin@testemail.ca",
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
        User_affiliations(permission="user_read", user_organization=org_one,)
    )

    save(user_read)

    result = run(
        query="""
        {
            userPage(userName: "testuserread@testemail.ca") {
                userName
                displayName
                lang
                tfa
                userAffiliations {
                    admin
                    organization
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
            "userPage": {
                "userName": "testuserread@testemail.ca",
                "displayName": "testuserread",
                "lang": "English",
                "tfa": False,
                "userAffiliations": [{"admin": False, "organization": "ORG1"}],
            }
        }
    }

    assert result == expected


def test_admin_cant_see_user_in_different_org(save):
    """
    Test to see that an admin can't see user in different org
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1"
    )
    save(org_one)
    admin_user = Users(
        display_name="testadmin",
        user_name="testadmin@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
    )
    admin_user.user_affiliation.append(User_affiliations(permission="admin",))

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

    result = run(
        query="""
        {
            userPage(userName: "testuserread@testemail.ca") {
                userName
                displayName
                lang
                tfa
                userAffiliations {
                    admin
                    organization
                }
            }
        }
        """,
        as_user=admin_user,
    )

    if "errors" not in result:
        fail("Expected to get an error. Instead: {}".format(json(result)))

    [error] = result["errors"]
    assert (
        error["message"] == "Error, user does not belong to any of your organizations"
    )


# User Write Tests
def test_user_write_cant_see_user_in_same_org(save):
    """
    Test to see that an user write cant see user information from their own org
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1"
    )
    save(org_one)
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
        User_affiliations(permission="user_read", user_organization=org_one,)
    )

    save(user_read)

    result = run(
        query="""
        {
            userPage(userName: "testuserread@testemail.ca") {
                userName
                displayName
                lang
                tfa
                userAffiliations {
                    admin
                    organization
                }
            }
        }
        """,
        as_user=user_write,
    )

    if "errors" not in result:
        fail("Expected to get an error. Instead: {}".format(json(result)))

    [error] = result["errors"]
    assert (
        error["message"]
        == "Error, you do not have permission to view this users information"
    )


def test_user_write_cant_see_user_in_different_org(save):
    """
    Test to see that an user write cant see user information from different org
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1"
    )
    save(org_one)
    user_write = Users(
        display_name="testuserwrite",
        user_name="testuserwrite@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
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
        User_affiliations(permission="user_read", user_organization=org_one,)
    )

    save(user_read)

    result = run(
        query="""
        {
            userPage(userName: "testuserread@testemail.ca") {
                userName
                displayName
                lang
                tfa
                userAffiliations {
                    admin
                    organization
                }
            }
        }
        """,
        as_user=user_write,
    )

    if "errors" not in result:
        fail("Expected to get an error. Instead: {}".format(json(result)))

    [error] = result["errors"]
    assert (
        error["message"] == "Error, user does not belong to any of your organizations"
    )


# User Read Tests
def test_user_read_cant_see_user_in_same_org(save):
    """
    Test to see that an user read cant see user information from their own org
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1"
    )
    save(org_one)
    user_read_2 = Users(
        display_name="testuserread2",
        user_name="testuserread2@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
    )
    user_read_2.user_affiliation.append(
        User_affiliations(permission="user_write", user_organization=org_one,)
    )

    save(user_read_2)

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

    result = run(
        query="""
        {
            userPage(userName: "testuserread@testemail.ca") {
                userName
                displayName
                lang
                tfa
                userAffiliations {
                    admin
                    organization
                }
            }
        }
        """,
        as_user=user_read_2,
    )

    if "errors" not in result:
        fail("Expected to get an error. Instead: {}".format(json(result)))

    [error] = result["errors"]
    assert (
        error["message"]
        == "Error, you do not have permission to view this users information"
    )


def test_user_read_cant_see_user_in_different_org(save):
    """
    Test to see that an user read cant see user information from different org
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1"
    )
    save(org_one)
    user_read_2 = Users(
        display_name="testuserread2",
        user_name="testuserread2@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
    )
    save(user_read_2)

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

    result = run(
        query="""
        {
            userPage(userName: "testuserread@testemail.ca") {
                userName
                displayName
                lang
                tfa
                userAffiliations {
                    admin
                    organization
                }
            }
        }
        """,
        as_user=user_read_2,
    )

    if "errors" not in result:
        fail("Expected to get an error. Instead: {}".format(json(result)))

    [error] = result["errors"]
    assert (
        error["message"] == "Error, user does not belong to any of your organizations"
    )


def test_user_read_can_see_own_information(save):
    """
    Test to see that a user read can see their own information
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1"
    )

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
    user_read.verify_account()
    save(user_read)

    result = run(
        """
        {
            userPage(userName: "testuserread@testemail.ca") {
                userName
                displayName
                lang
                tfa
                userAffiliations {
                    admin
                    organization
                }
            }
        }
        """,
        as_user=user_read,
    )

    if "errors" in result:
        fail("Expected to get user details. Instead: {}".format(json(result)))

    expected = {
        "data": {
            "userPage": {
                "userName": "testuserread@testemail.ca",
                "displayName": "testuserread",
                "lang": "English",
                "tfa": False,
                "userAffiliations": [
                    {"admin": False, "organization": "ORG1"},
                    {"admin": True, "organization": "TESTUSERREAD-TESTEMAIL-CA"},
                ],
            }
        }
    }

    assert result == expected
