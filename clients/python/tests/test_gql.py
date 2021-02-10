import re
import pytest

from tracker_client.client import get_auth_token, create_client

# These are not very good tests as they do actually connect to the API.
# Will be replaced as soon as I work out a good solution for mocking the API
JWT_RE = r"^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$"


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
    """Check that create_client creates a client.
    Need to figure out a better test for this"""
    client = create_client("https://tracker.alpha.canada.ca/graphql")
    assert client is not None
    assert client.transport is not None


def test_create_client_invalid_token_not_str():
    """Check that create_client raises a TypeError when given non-string auth-token"""
    with pytest.raises(TypeError):
        create_client("https://tracker.alpha.canada.ca/graphql", 123)


def test_create_client_invalid_token_malformed():
    """Check that create_client raises a TypeError when given non-string auth-token"""
    with pytest.raises(ValueError):
        create_client("https://tracker.alpha.canada.ca/graphql", "foo")
