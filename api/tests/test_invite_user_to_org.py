import logging
import pytest
import pytest_mock

from pytest import fail

from db import DB
from models import Organizations, Users, User_affiliations
from json_web_token import tokenize
from tests.test_functions import json, run


@pytest.fixture()
def db():
    s, cleanup, db_session = DB()
    yield s, db_session
    cleanup()


def test_successful_invite_existing_user_to_org_existing_user(caplog, db, mocker):
    """
    Test that an admin can successfully invite a user to their organization
    """
    save, session = db

    mocker.patch(
        "schemas.invite_user_to_org.invite_user_to_org.send_invite_to_org_notification_email",
        autospec=True,
        return_value=True,
    )

    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1"
    )
    save(org_one)

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
    )
    save(user)

    admin = Users(
        display_name="testadmin",
        user_name="testadmin@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
    )
    save(admin)

    admin_affiliation = User_affiliations(
        user_id=admin.id, organization_id=org_one.id, permission="admin",
    )
    save(admin_affiliation)

    caplog.set_level(logging.INFO)
    result = run(
        mutation=f"""
        mutation {{
            inviteUserToOrg (
                input: {{
                    userName: "{user.user_name}"
                    orgSlug: "{org_one.slug}"
                    requestedRole: USER_READ
                    preferredLanguage: ENGLISH
                }}
            ) {{
                status
            }}
        }}
        """,
        as_user=admin,
    )

    if "errors" in result:
        fail(
            "Expected successful invitation to organization, instead: {}".format(
                json(result)
            )
        )

    expected_result = {
        "data": {
            "inviteUserToOrg": {
                "status": "Successfully invited user to organization, and sent notification email."
            }
        }
    }

    affiliation = (
        session.query(User_affiliations)
        .filter(User_affiliations.user_id == user.id)
        .filter(User_affiliations.organization_id == org_one.id)
        .filter(User_affiliations.permission == "user_read")
        .first()
    )
    assert affiliation is not None

    assert result == expected_result
    assert (
        f"User: {admin.id} successfully added {user.id} to {org_one.slug}."
        in caplog.text
    )


def test_un_successful_invite_existing_user_to_org_user_does_not_have_admin_existing_user(
    caplog, db, mocker
):
    """
    Test that a user without admin cannot invite a user
    """
    save, session = db

    mocker.patch(
        "schemas.invite_user_to_org.invite_user_to_org.send_invite_to_org_notification_email",
        autospec=True,
        return_value=True,
    )

    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1"
    )
    save(org_one)

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
    )
    save(user)

    user_2 = Users(
        display_name="testuser2",
        user_name="testuser2@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
    )
    save(user_2)

    user_2_affiliation = User_affiliations(
        user_id=user_2.id, organization_id=org_one.id, permission="user_read",
    )
    save(user_2_affiliation)

    caplog.set_level(logging.INFO)
    result = run(
        mutation=f"""
        mutation {{
            inviteUserToOrg (
                input: {{
                    userName: "{user.user_name}"
                    orgSlug: "{org_one.slug}"
                    requestedRole: USER_READ
                    preferredLanguage: ENGLISH
                }}
            ) {{
                status
            }}
        }}
        """,
        as_user=user_2,
    )

    if "errors" not in result:
        fail(
            "Expected permission error when non admin tries to invite user, instead: {}".format(
                json(result)
            )
        )

    [error] = result["errors"]
    assert (
        error["message"]
        == "Error, you do not have access to invite users this organization."
    )
    assert (
        f"User: {user_2.id} attempted to invite user to organization-1, but does not have admin access."
        in caplog.text
    )


def test_successful_invite_non_existing_user_to_org_existing_user(caplog, db, mocker):
    """
    Test that an admin can successfully invite a user to their organization,
    and the service
    """
    save, session = db

    mocker.patch(
        "schemas.invite_user_to_org.invite_user_to_org.send_invite_to_service_email",
        autospec=True,
        return_value=True,
    )

    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1"
    )
    save(org_one)

    admin = Users(
        display_name="testadmin",
        user_name="testadmin@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
    )
    save(admin)

    admin_affiliation = User_affiliations(
        user_id=admin.id, organization_id=org_one.id, permission="admin",
    )
    save(admin_affiliation)

    user_name = "testuser@testemail.ca"

    caplog.set_level(logging.INFO)
    result = run(
        mutation=f"""
        mutation {{
            inviteUserToOrg (
                input: {{
                    userName: "{user_name}"
                    orgSlug: "{org_one.slug}"
                    requestedRole: USER_READ
                    preferredLanguage: ENGLISH
                }}
            ) {{
                status
            }}
        }}
        """,
        as_user=admin,
    )

    if "errors" in result:
        fail(
            "Expected successful invitation to organization, instead: {}".format(
                json(result)
            )
        )

    expected_result = {
        "data": {
            "inviteUserToOrg": {
                "status": "Successfully sent invitation to service, and organization email."
            }
        }
    }

    assert result == expected_result
    assert (
        f"User: {admin.id}, sent an invitation email to {user_name}, for the {org_one.slug} organization."
        in caplog.text
    )
