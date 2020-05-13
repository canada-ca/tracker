import pytest
import json

from json_web_token import tokenize, auth_header
from pytest import fail
from graphene.test import Client

from app import app
from db import DB
from queries import schema
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
def test_super_admin_can_see_any_user_list(save):
    """
    Test to see if super admins can view user list of different org
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


# Admin Tests
def test_admin_can_see_user_list_in_same_org(save):
    """
    Test to see if admin can view user list of same org
    """
    org_one = Organizations(
        acronym="ORG1",
        name="Organization 1"
    )
    save(org_one)
    admin_user = Users(
        display_name="testadmin",
        user_name="testadmin@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
    )
    admin_user.user_affiliation.append(
        User_affiliations(
            permission="super_admin",
            user_organization=org_one,
        )
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
        User_affiliations(
            permission="user_read",
            user_organization=org_one,
        )
    )
    save(user_read)

    token = tokenize(user_id=admin_user.id, roles=admin_user.roles)

    result = Client(schema).execute(
        """
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
                    }
                ]
            }
        }
    }

    assert result == expected


def test_admin_cant_see_user_list_in_different_org(save):
    """
    Test to see if admin cant view user list of different org
    """
    org_one = Organizations(
        acronym="ORG1",
        name="Organization 1"
    )
    save(org_one)
    org_two = Organizations(
        acronym="ORG2",
        name="Organization 2"
    )
    save(org_two)
    admin_user = Users(
        display_name="testadmin",
        user_name="testadmin@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
    )
    admin_user.user_affiliation.append(
        User_affiliations(
            permission="admin",
            user_organization=org_one,
        )
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
        User_affiliations(
            permission="user_read",
            user_organization=org_two,
        )
    )
    save(user_read)

    token = tokenize(user_id=admin_user.id, roles=admin_user.roles)

    result = Client(schema).execute(
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
        context_value=auth_header(token),
    )

    if "errors" not in result:
        fail(
            "Expected to get an error. Instead: {}".format(json.dumps(result, indent=2))
        )

    [error] = result["errors"]
    assert (
        error["message"] == "Error, you do not have permission to view this user lists"
    )


# User Write Tests
def test_user_write_cant_see_user_list(save):
    """
    Test to see if user write cant view user list of any org
    """
    org_one = Organizations(
        acronym="ORG1",
        name="Organization 1"
    )
    save(org_one)
    org_two = Organizations(
        acronym="ORG2",
        name="Organization 2"
    )
    save(org_two)
    user_write = Users(
        display_name="testuserwrite",
        user_name="testuserwrite@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
    )
    user_write.user_affiliation.append(
        User_affiliations(
            permission="user_write",
            user_organization=org_one,
        )
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
        User_affiliations(
            permission="user_read",
            user_organization=org_two,
        )
    )
    save(user_read)

    token = tokenize(user_id=user_write.id, roles=user_write.roles)

    result = Client(schema).execute(
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
        context_value=auth_header(token),
    )

    if "errors" not in result:
        fail(
            "Expected to get an error. Instead: {}".format(json.dumps(result, indent=2))
        )

    [error] = result["errors"]
    assert (
        error["message"] == "Error, you do not have permission to view this user lists"
    )


# User Read Tests
def test_user_read_cant_see_user_list(save):
    """
    Test to see if user Read cant view user list of any org
    """
    org_one = Organizations(
        acronym="ORG1",
        name="Organization 1"
    )
    save(org_one)
    org_two = Organizations(
        acronym="ORG2",
        name="Organization 2"
    )
    save(org_two)
    user_read = Users(
        display_name="testuserread2",
        user_name="testuserread2@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
    )
    user_read.user_affiliation.append(
        User_affiliations(
            permission="user_read",
            user_organization=org_one,
        )
    )
    save(user_read)

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
            user_organization=org_two,
        )
    )
    save(user_read)

    token = tokenize(user_id=user_read.id, roles=user_read.roles)

    result = Client(schema).execute(
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
        context_value=auth_header(token),
    )

    if "errors" not in result:
        fail(
            "Expected to get an error. Instead: {}".format(json.dumps(result, indent=2))
        )

    [error] = result["errors"]
    assert (
        error["message"] == "Error, you do not have permission to view this user lists"
    )
