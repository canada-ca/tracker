import logging
import pytest

from pytest import fail
from db import DB
from models import Organizations, User_affiliations, Users
from tests.test_functions import run, json


@pytest.fixture
def db():
    s, cleanup, session = DB()
    yield s, session
    cleanup()


def test_user_can_update_all_profile_fields(db, caplog):
    """
    Test that user can update all profile fields
    """
    save, session = db

    org_one = Organizations(name="org-one")
    save(org_one)

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        preferred_lang="english",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org_one),
        ],
    )
    save(user)

    caplog.set_level(logging.INFO)
    result = run(
        mutation="""
        mutation {
            updateUserProfile (
                input: {
                    userName: "newemail@email.ca"
                    displayName: "New Test Account",
                    preferredLang: FRENCH,
                    password: "newpassword123"
                    confirmPassword: "newpassword123"
                }
            ) {
                status
            }
        }
        """,
        as_user=user,
    )

    if "errors" in result:
        fail(f"Expected to update user profile information, instead: {json(result)}")

    expected_result = {
        "data": {"updateUserProfile": {"status": "Successfully updated account."}}
    }

    assert result == expected_result
    assert (
        f"User: {user.id} successfully updated display_name, user_name, preferred_lang, password, of their user profile."
        in caplog.text
    )

    caplog.clear()

    caplog.set_level(logging.INFO)
    result = run(
        mutation="""
        mutation {
            authenticate (
                input: {
                    userName: "newemail@email.ca"
                    password: "newpassword123"
                }
            ) {
                authResult {
                    user {
                        userName
                        displayName
                        lang
                    }
                }
            }
        }
        """
    )

    if "errors" in result:
        fail(
            f"Expected to authenticate with new user profile details, instead: {json(result)}"
        )

    expected_result = {
        "data": {
            "authenticate": {
                "authResult": {
                    "user": {
                        "userName": "newemail@email.ca",
                        "displayName": "New Test Account",
                        "lang": "french",
                    }
                }
            }
        }
    }

    assert result == expected_result
    assert f"User: {user.id} successfully authenticated their account." in caplog.text


def test_password_wont_update_if_fields_dont_match(db, caplog):
    """
    Test to make sure that if password fields don't match then update doesn't occur
    """
    save, session = db

    org_one = Organizations(name="org-one")
    save(org_one)

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        preferred_lang="english",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org_one),
        ],
    )
    save(user)

    caplog.set_level(logging.INFO)
    result = run(
        mutation="""
        mutation {
            updateUserProfile (
                input: {
                    password: "newpassword123"
                    confirmPassword: "321drowssapwen"
                }
            ) {
                status
            }
        }
        """,
        as_user=user,
    )

    if "errors" not in result:
        fail(f"Expected password matching error to occur, instead: {json(result)}")

    [error] = result["errors"]
    assert (
        error["message"] == "Error, passwords do not match. Unable to update profile."
    )
    assert (
        f"User: {user.id} attempted to update their password, however they do not match."
        in caplog.text
    )
