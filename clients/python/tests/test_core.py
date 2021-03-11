"""Tests for gql related utility functions"""
import re
import pytest

import tracker_client.core as core
import tracker_client.queries as queries

# pylint: disable=no-member
# RegEx to check if a JWT is correctly formed
JWT_RE = r"^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$"

# Not a valid tracker JWT and never was, but is a real JWT
REAL_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkZvbyIsImlhdCI6MTUxNjIzOTAyMn0.sTo9dB352rSrMPeks8oTGuSpbuHytmoM7zENg_RfkDQ"

# Tests that may try to connect to Tracker are marked. Will try to make them offline


def test_get_auth_token(mocker, get_auth_success):
    """Check to see if get_auth_token returns a proper token.
    Will fail if credentials are not present in environmental variables.
    """
    mocker.patch("tracker_client.core.Client.execute", return_value=get_auth_success)
    # Check the returned token against Regex for valid JWT
    assert re.match(JWT_RE, core.get_auth_token())


def test_get_auth_error(mocker, capsys, get_auth_error):
    """Test that get_auth_token raises an exception on SignInError"""
    mocker.patch("tracker_client.core.Client.execute", return_value=get_auth_error)

    with pytest.raises(RuntimeError):
        core.get_auth_token()

    captured = capsys.readouterr()
    assert "Unable to sign in to Tracker." in captured.out


def test_get_auth_tfa(mocker, get_auth_tfa):
    """Test that get_auth_token calls _tfa_get_auth_token on TFASignInResult"""
    mocker.patch("tracker_client.core.Client.execute", return_value=get_auth_tfa)
    mocker.patch("tracker_client.core._tfa_get_auth_token")
    core.get_auth_token()
    core._tfa_get_auth_token.assert_called_once()


def test_get_auth_token_no_creds(monkeypatch):
    """Check that an exception is raised by get_auth_token when no credentials are
    present in the current environment"""
    # Temporarily remove credentials from environment if present
    monkeypatch.delenv("TRACKER_UNAME", raising=False)
    monkeypatch.delenv("TRACKER_PASS", raising=False)

    with pytest.raises(ValueError):
        core.get_auth_token()


@pytest.mark.parametrize("send_method", ["phone", "email"])
def test_tfa_get_auth_token(mocker, send_method, get_tfa_auth_success):
    """Test that _tfa_get_auth_token attempts authentication correctly"""
    mocker.patch("tracker_client.core.input", return_value=123)
    test_client = mocker.MagicMock()
    test_client.execute = mocker.MagicMock(return_value=get_tfa_auth_success)

    assert re.match(JWT_RE, core._tfa_get_auth_token(send_method, "foo", test_client))
    expected_params = {
        "authInput": {"authenticationCode": 123, "authenticateToken": "foo"}
    }
    test_client.execute.assert_called_once_with(
        queries.TFA_AUTH, variable_values=expected_params
    )


def test_tfa_get_auth_token_error(mocker, capsys, get_tfa_auth_error):
    """Test that _tfa_get_auth_token raises an exception on AuthenticateError"""
    mocker.patch("tracker_client.core.input", return_value=123)
    test_client = mocker.MagicMock()
    test_client.execute = mocker.MagicMock(return_value=get_tfa_auth_error)

    with pytest.raises(RuntimeError):
        core._tfa_get_auth_token("phone", "foo", test_client)

    captured = capsys.readouterr()
    assert "Unable to authenticate" in captured.out


def test_create_client():
    """Check that create_client creates a client when not passed auth_token."""
    client = core.create_client()
    assert client is not None
    assert client.transport is not None


def test_create_client_with_auth():
    """Check that create_client creates a client when passed auth_token."""
    client = core.create_client(auth_token=REAL_JWT)
    assert client is not None
    assert client.transport is not None


def test_create_client_invalid_token_not_str():
    """Check that create_client raises a TypeError when given non-string auth-token"""
    with pytest.raises(TypeError):
        core.create_client(auth_token=123)


def test_create_client_invalid_token_malformed():
    """Check that create_client raises a ValueError when given malformed auth-token"""
    with pytest.raises(ValueError):
        core.create_client(auth_token="foo")


def test_create_client_invalid_language():
    """Check that create_client raises a ValueError when given invalid language"""
    with pytest.raises(ValueError):
        core.create_client(auth_token=REAL_JWT, language="foo")
