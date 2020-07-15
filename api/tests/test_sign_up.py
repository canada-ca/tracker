import logging
import pytest
import pytest_mock

from pytest import fail

from db import DB
from models import Organizations, Users, User_affiliations
from functions.error_messages import *
from json_web_token import tokenize
from tests.test_functions import json, run


@pytest.fixture()
def db():
    s, cleanup, db_session = DB()
    yield s, db_session
    cleanup()


def test_successful_creation_english(db, mocker, caplog):
    """
    Test that ensures a user can be created successfully using the api endpoint
    """
    _, session = db

    mocker.patch(
        "schemas.sign_up.create_user.send_verification_email",
        autospec=True,
        return_value="delivered",
    )

    caplog.set_level(logging.INFO)
    result = run(
        mutation="""
        mutation {
            signUp(
                input: {
                    displayName: "user-test"
                    userName: "different-email@testemail.ca"
                    password: "testpassword123"
                    confirmPassword: "testpassword123"
                    preferredLang: ENGLISH
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
        """,
    )

    if "errors" in result:
        fail("Tried to create a user, instead: {}".format(json(result)))

    expected_result = {
        "data": {
            "signUp": {
                "authResult": {
                    "user": {
                        "userName": "different-email@testemail.ca",
                        "displayName": "user-test",
                        "lang": "english",
                    }
                }
            }
        }
    }

    user = (
        session.query(Users)
        .filter(Users.user_name == "different-email@testemail.ca")
        .first()
    )

    assert result == expected_result
    assert f"Successfully created new user: {user.id}" in caplog.text


def test_successful_creation_french(db, mocker, caplog):
    """
    Test that ensures a user can be created successfully using the api endpoint
    """
    _, session = db

    mocker.patch(
        "schemas.sign_up.create_user.send_verification_email",
        autospec=True,
        return_value="delivered",
    )

    caplog.set_level(logging.INFO)
    result = run(
        mutation="""
        mutation {
            signUp(
                input: {
                    displayName: "user-test"
                    userName: "different-email@testemail.ca"
                    password: "testpassword123"
                    confirmPassword: "testpassword123"
                    preferredLang: FRENCH
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
        """,
    )

    if "errors" in result:
        fail("Tried to create a user, instead: {}".format(json(result)))

    expected_result = {
        "data": {
            "signUp": {
                "authResult": {
                    "user": {
                        "userName": "different-email@testemail.ca",
                        "displayName": "user-test",
                        "lang": "french",
                    }
                }
            }
        }
    }

    user = (
        session.query(Users)
        .filter(Users.user_name == "different-email@testemail.ca")
        .first()
    )

    assert result == expected_result
    assert f"Successfully created new user: {user.id}" in caplog.text


def test_email_address_in_use(db, caplog):
    """Test that ensures each user has a unique email address"""
    save, session = db

    test_user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
    )
    save(test_user)

    caplog.set_level(logging.WARNING)
    error_result = run(
        mutation="""
        mutation {
            signUp(
                input: {
                    displayName: "testuser"
                    userName: "testuser@testemail.ca"
                    password: "testpassword123"
                    confirmPassword: "testpassword123"
                    preferredLang: ENGLISH
                }
            ) {
                authResult {
                    user {
                        userName
                        displayName
                    }
                }
            }
        }
        """,
    )

    if "errors" not in error_result:
        fail(
            "Trying to create user with same username should fail, instead".format(
                json(error_result)
            )
        )

    user = (
        session.query(Users).filter(Users.user_name == "testuser@testemail.ca").first()
    )

    [error] = error_result["errors"]
    assert error["message"] == error_email_in_use()
    assert (
        f"User tried to sign up using: testuser@testemail.ca but account already exists {user.id}"
        in caplog.text
    )


def test_password_too_short(db, caplog):
    """
    Test that ensure that a user's password meets the valid length requirements
    """
    save, _ = db

    caplog.set_level(logging.WARNING)
    result = run(
        mutation="""
        mutation {
            signUp(
                input: {
                    displayName: "testuser"
                    userName: "testuser@testemail.ca"
                    password: "test"
                    confirmPassword: "test"
                    preferredLang: FRENCH
                }
            ) {
                authResult {
                    user {
                        userName
                        displayName
                    }
                }
            }
        }
        """,
    )

    if "errors" not in result:
        fail(
            "Password too short when creating user should error out, instead: {}".format(
                json(result)
            )
        )

    [error] = result["errors"]
    assert error["message"] == error_password_does_not_meet_requirements()
    assert (
        f"User: testuser@testemail.ca tried to sign up but password did not meet requirements."
        in caplog.text
    )


def test_passwords_do_not_match(caplog):
    """
    Test to ensure that user password matches their password confirmation
    """
    caplog.set_level(logging.WARNING)
    result = run(
        mutation="""
        mutation {
            signUp(
                input: {
                    displayName: "testuser"
                    userName: "testuser@testemail.ca"
                    password: "testpassword123"
                    confirmPassword: "passwordtest123"
                    preferredLang: ENGLISH
                }
            ) {
                authResult {
                    user {
                        userName
                        displayName
                    }
                }
            }
        }
        """,
    )

    if "errors" not in result:
        fail(
            "Passwords do not match when creating user should error, instead: {}".format(
                json(result)
            )
        )

    [error] = result["errors"]
    assert error["message"] == error_passwords_do_not_match()
    assert (
        f"User: testuser@testemail.ca tried to sign up but passwords were not matching."
        in caplog.text
    )


def test_sign_up_with_invite_token(db, caplog, mocker):
    """
    Test to see if a user can successfully sign up with a token and be
    assigned automatically to an organization
    """
    save, session = db

    mocker.patch(
        "schemas.sign_up.create_user.send_verification_email",
        autospec=True,
        return_value="delivered",
    )

    org = Organizations(name="test org", slug="test-org", acronym="TEST-ORG",)
    save(org)

    user_name = "new.account@istio.actually.works"

    sign_up_token = tokenize(
        exp_period=1,
        parameters={
            "user_name": user_name,
            "org_id": org.id,
            "requested_level": "admin",
        },
    )

    caplog.set_level(logging.INFO)
    result = run(
        mutation=f"""
        mutation {{
            signUp(
                input: {{
                    userName: "{user_name}"
                    password: "testpassword123"
                    confirmPassword: "testpassword123"
                    displayName: "test account"
                    preferredLang: ENGLISH
                    signUpToken: "{sign_up_token}"
                }}
            ) {{
                authResult {{
                    user {{
                        displayName
                    }}
                }}
            }}
        }}
        """
    )

    if "errors" in result:
        fail("Tried to sign up with a signUpToken, instead: {}".format(json(result)))

    user = session.query(Users).filter(Users.user_name == user_name).first()
    affiliation = (
        session.query(User_affiliations)
        .filter(User_affiliations.user_id == user.id)
        .filter(User_affiliations.organization_id == org.id)
        .first()
    )

    assert affiliation.permission == "admin"

    expected_result = {
        "data": {"signUp": {"authResult": {"user": {"displayName": "test account"}}}}
    }

    assert result == expected_result
    assert (
        f"Successfully created affiliation for {user.user_name} to {org.id}."
        in caplog.text
    )
    assert f"Successfully created new user: {user.id}" in caplog.text


def test_sign_up_with_invite_token_missing_user_name_in_token(db, caplog, mocker):
    """
    Test to see if error occurs when the user name is left empty
    """
    save, session = db

    mocker.patch(
        "schemas.sign_up.create_user.send_verification_email",
        autospec=True,
        return_value="delivered",
    )

    org = Organizations(name="test org", slug="test-org", acronym="TEST-ORG",)
    save(org)

    user_name = "new.account@istio.actually.works"

    sign_up_token = tokenize(
        exp_period=1, parameters={"org_id": org.id, "requested_level": "admin",}
    )

    caplog.set_level(logging.INFO)
    result = run(
        mutation=f"""
        mutation {{
            signUp(
                input: {{
                    userName: "{user_name}"
                    password: "testpassword123"
                    confirmPassword: "testpassword123"
                    displayName: "test account"
                    preferredLang: ENGLISH
                    signUpToken: "{sign_up_token}"
                }}
            ) {{
                authResult {{
                    user {{
                        displayName
                    }}
                }}
            }}
        }}
        """
    )

    if "errors" not in result:
        fail(
            "Tried to create missing field in token error, instead: {}".format(
                json(result)
            )
        )

    user = session.query(Users).filter(Users.user_name == user_name).first()
    assert user is None

    [error] = result["errors"]
    assert (
        error["message"]
        == "Error, please request a new invite email from the organization admin."
    )
    assert (
        f"User: {user_name} attempted to sign up with an invite token but user_name field(s) were missing."
        in caplog.text
    )


def test_sign_up_with_invite_token_missing_org_id_in_token(db, caplog, mocker):
    """
    Test to see if error occurs when the org id is left empty
    """
    save, session = db

    mocker.patch(
        "schemas.sign_up.create_user.send_verification_email",
        autospec=True,
        return_value="delivered",
    )

    org = Organizations(name="test org", slug="test-org", acronym="TEST-ORG",)
    save(org)

    user_name = "new.account@istio.actually.works"

    sign_up_token = tokenize(
        exp_period=1, parameters={"user_name": user_name, "requested_level": "admin",}
    )

    caplog.set_level(logging.INFO)
    result = run(
        mutation=f"""
        mutation {{
            signUp(
                input: {{
                    userName: "{user_name}"
                    password: "testpassword123"
                    confirmPassword: "testpassword123"
                    displayName: "test account"
                    preferredLang: ENGLISH
                    signUpToken: "{sign_up_token}"
                }}
            ) {{
                authResult {{
                    user {{
                        displayName
                    }}
                }}
            }}
        }}
        """
    )

    if "errors" not in result:
        fail(
            "Tried to create missing field in token error, instead: {}".format(
                json(result)
            )
        )

    user = session.query(Users).filter(Users.user_name == user_name).first()
    assert user is None

    [error] = result["errors"]
    assert (
        error["message"]
        == "Error, please request a new invite email from the organization admin."
    )
    assert (
        f"User: {user_name} attempted to sign up with an invite token but org_id field(s) were missing."
        in caplog.text
    )


def test_sign_up_with_invite_token_missing_requested_level_in_token(db, caplog, mocker):
    """
    Test to see if error occurs when the requested level is left empty
    """
    save, session = db

    mocker.patch(
        "schemas.sign_up.create_user.send_verification_email",
        autospec=True,
        return_value="delivered",
    )

    org = Organizations(name="test org", slug="test-org", acronym="TEST-ORG",)
    save(org)

    user_name = "new.account@istio.actually.works"

    sign_up_token = tokenize(
        exp_period=1, parameters={"user_name": user_name, "org_id": org.id,}
    )

    caplog.set_level(logging.INFO)
    result = run(
        mutation=f"""
        mutation {{
            signUp(
                input: {{
                    userName: "{user_name}"
                    password: "testpassword123"
                    confirmPassword: "testpassword123"
                    displayName: "test account"
                    preferredLang: ENGLISH
                    signUpToken: "{sign_up_token}"
                }}
            ) {{
                authResult {{
                    user {{
                        displayName
                    }}
                }}
            }}
        }}
        """
    )

    if "errors" not in result:
        fail(
            "Tried to create missing field in token error, instead: {}".format(
                json(result)
            )
        )

    user = session.query(Users).filter(Users.user_name == user_name).first()
    assert user is None

    [error] = result["errors"]
    assert (
        error["message"]
        == "Error, please request a new invite email from the organization admin."
    )
    assert (
        f"User: {user_name} attempted to sign up with an invite token but requested_level field(s) were missing."
        in caplog.text
    )


def test_sign_up_with_invite_token_missing_all_fields_in_token(db, caplog, mocker):
    """
    Test to see if error occurs when all fields are left empty
    """
    save, session = db

    mocker.patch(
        "schemas.sign_up.create_user.send_verification_email",
        autospec=True,
        return_value="delivered",
    )

    org = Organizations(name="test org", slug="test-org", acronym="TEST-ORG",)
    save(org)

    user_name = "new.account@istio.actually.works"

    sign_up_token = tokenize(exp_period=1, parameters={})

    caplog.set_level(logging.INFO)
    result = run(
        mutation=f"""
        mutation {{
            signUp(
                input: {{
                    userName: "{user_name}"
                    password: "testpassword123"
                    confirmPassword: "testpassword123"
                    displayName: "test account"
                    preferredLang: ENGLISH
                    signUpToken: "{sign_up_token}"
                }}
            ) {{
                authResult {{
                    user {{
                        displayName
                    }}
                }}
            }}
        }}
        """
    )

    if "errors" not in result:
        fail(
            "Tried to create missing field in token error, instead: {}".format(
                json(result)
            )
        )

    user = session.query(Users).filter(Users.user_name == user_name).first()
    assert user is None

    [error] = result["errors"]
    assert (
        error["message"]
        == "Error, please request a new invite email from the organization admin."
    )
    assert (
        f"User: {user_name} attempted to sign up with an invite token but user_name org_id requested_level field(s) were missing."
        in caplog.text
    )
