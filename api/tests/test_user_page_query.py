import pytest
import json

from json_web_token import tokenize, auth_header
from flask import Request
from pytest import fail
from graphene.test import Client
from unittest import TestCase
from werkzeug.test import create_environ

from app import app
from db import DB
from queries import schema
from backend.security_check import SecurityAnalysisBackend
from models import (
    Organizations,
    Users,
    User_affiliations,
)

s, cleanup, session = DB()


@pytest.fixture
def save():
    with app.app_context():
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
    save(user_read)

    token = tokenize(user_id=sa_user.id, roles=sa_user.roles)

    result = Client(schema).execute(
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
        context_value=auth_header(token),
    )

    if "errors" in result:
        fail(
            "Expected to get user details. Instead: {}".format(
                json.dumps(result, indent=2)
            )
        )

    expected = {
        "data": {
            "userPage": {
                "userName": "testuserread@testemail.ca",
                "displayName": "testuserread",
                "lang": "English",
                "tfa": False,
                "userAffiliations": [
                    {"admin": True, "organization": "TESTUSERREAD-TESTEMAIL-CA"},
                    {"admin": False, "organization": "ORG1"},
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

    token = tokenize(user_id=admin_user.id, roles=admin_user.roles)

    result = Client(schema).execute(
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
        context_value=auth_header(token),
    )

    if "errors" in result:
        fail(
            "Expected to get user details. Instead: {}".format(
                json.dumps(result, indent=2)
            )
        )

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

    token = tokenize(user_id=admin_user.id, roles=admin_user.roles)

    result = Client(schema).execute(
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
        context_value=auth_header(token),
    )

    if "errors" not in result:
        fail(
            "Expected to get an error. Instead: {}".format(json.dumps(result, indent=2))
        )

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

    token = tokenize(user_id=user_write.id, roles=user_write.roles)

    result = Client(schema).execute(
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
        context_value=auth_header(token),
    )

    if "errors" not in result:
        fail(
            "Expected to get an error. Instead: {}".format(json.dumps(result, indent=2))
        )

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

    token = tokenize(user_id=user_write.id, roles=user_write.roles)

    result = Client(schema).execute(
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
        context_value=auth_header(token),
    )

    if "errors" not in result:
        fail(
            "Expected to get an error. Instead: {}".format(json.dumps(result, indent=2))
        )

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

    token = tokenize(user_id=user_read_2.id, roles=user_read_2.roles)

    result = Client(schema).execute(
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
        context_value=auth_header(token),
    )

    if "errors" not in result:
        fail(
            "Expected to get an error. Instead: {}".format(json.dumps(result, indent=2))
        )

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

    token = tokenize(user_id=user_read_2.id, roles=user_read_2.roles)

    result = Client(schema).execute(
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
        context_value=auth_header(token),
    )

    if "errors" not in result:
        fail(
            "Expected to get an error. Instead: {}".format(json.dumps(result, indent=2))
        )

    [error] = result["errors"]
    assert (
        error["message"] == "Error, user does not belong to any of your organizations"
    )


def test_user_read_and_higher_can_own_information(save):
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

    save(user_read)

    token = tokenize(user_id=user_read.id, roles=user_read.roles)

    result = Client(schema).execute(
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
        context_value=auth_header(token),
    )

    if "errors" in result:
        fail(
            "Expected to get user details. Instead: {}".format(
                json.dumps(result, indent=2)
            )
        )

    expected = {
        "data": {
            "userPage": {
                "userName": "testuserread@testemail.ca",
                "displayName": "testuserread",
                "lang": "English",
                "tfa": False,
                "userAffiliations": [
                    {"admin": True, "organization": "TESTUSERREAD-TESTEMAIL-CA"},
                    {"admin": False, "organization": "ORG1"},
                ],
            }
        }
    }

    assert result == expected
