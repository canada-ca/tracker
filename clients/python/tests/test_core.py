"""Tests for gql related utility functions"""
import re
import pytest

from tracker_client.core import get_auth_token, create_client

# RegEx to check if a JWT is correctly formed
JWT_RE = r"^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$"

# Not a valid tracker JWT and never was, but is a real JWT
REAL_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkZvbyIsImlhdCI6MTUxNjIzOTAyMn0.sTo9dB352rSrMPeks8oTGuSpbuHytmoM7zENg_RfkDQ"

# Tests that may try to connect to Tracker are marked. Will try to make them offline
# but there will likely be a few tests that are only meaningful with network access


@pytest.mark.online
def test_get_auth_token():
    """Check to see if get_auth_token returns a proper token.
    Will fail if credentials are not present in environmental variables.
    """
    # Check the returned token against Regex for valid JWT
    assert re.match(JWT_RE, get_auth_token())


def test_get_auth_token_no_creds(monkeypatch):
    """Check that an exception is raised by get_auth_token when no credentials are
    present in the current environment"""
    # Temporarily remove credentials from environment if present
    monkeypatch.delenv("TRACKER_UNAME", raising=False)
    monkeypatch.delenv("TRACKER_PASS", raising=False)

    with pytest.raises(ValueError):
        get_auth_token()


def test_create_client():
    """Check that create_client creates a client when not passed auth_token."""
    client = create_client()
    assert client is not None
    assert client.transport is not None


def test_create_client_with_auth():
    """Check that create_client creates a client when passed auth_token."""
    client = create_client(auth_token=REAL_JWT)
    assert client is not None
    assert client.transport is not None


def test_create_client_invalid_token_not_str():
    """Check that create_client raises a TypeError when given non-string auth-token"""
    with pytest.raises(TypeError):
        create_client("https://tracker.alpha.canada.ca/graphql", 123)


def test_create_client_invalid_token_malformed():
    """Check that create_client raises a ValueError when given malformed auth-token"""
    with pytest.raises(ValueError):
        create_client("https://tracker.alpha.canada.ca/graphql", "foo")
