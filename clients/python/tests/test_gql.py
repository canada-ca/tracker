import re
import pytest

from gql import Client
from gql.transport.exceptions import (
    TransportQueryError,
    TransportServerError,
    TransportProtocolError,
)

from tracker_client.client import get_auth_token, create_client, execute_query

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
    client = create_client()
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


def test_execute_query_transport_query_error(monkeypatch):
    server_error_response = {
        "message": "No organization with the provided slug could be found.",
        "locations": [{"line": 2, "column": 3}],
        "path": ["findOrganizationBySlug"],
        "extensions": {"code": "INTERNAL_SERVER_ERROR"},
    }

    def mock_exception(self, query, variable_values):
        raise TransportQueryError(
            str(server_error_response),
            errors=[server_error_response],
            data={"foo": None},
        )

    client = Client()
    monkeypatch.setattr(Client, "execute", mock_exception)
    result = execute_query(client, None, None)
    assert result == {
        "error": {"message": "No organization with the provided slug could be found."}
    }


def test_execute_query_transport_protocol_error(monkeypatch, capsys):
    def mock_exception(self, query, variable_values):
        raise TransportProtocolError

    client = Client()
    monkeypatch.setattr(Client, "execute", mock_exception)

    with pytest.raises(TransportProtocolError):
        execute_query(client, None, None)

    # Check that the warning for TransportProtocolError was printed
    captured = capsys.readouterr()
    assert "Unexpected response from server:" in captured.out


def test_execute_query_transport_server_error(monkeypatch, capsys):
    def mock_exception(self, query, variable_values):
        raise TransportServerError

    client = Client()
    monkeypatch.setattr(Client, "execute", mock_exception)

    with pytest.raises(TransportServerError):
        execute_query(client, None, None)

    # Check that the warning for TransportServerError was printed
    captured = capsys.readouterr()
    assert "Server error:" in captured.out


def test_execute_query_other_error(monkeypatch, capsys):
    def mock_exception(self, query, variable_values):
        raise ValueError

    client = Client()
    monkeypatch.setattr(Client, "execute", mock_exception)

    with pytest.raises(ValueError):
        execute_query(client, None, None)

    # Check that the warning for other errors was printed
    captured = capsys.readouterr()
    assert "Fatal error:" in captured.out


def test_execute_query_success(monkeypatch, all_domains_input):
    def mock_return(self, query, variable_values):
        return all_domains_input

    client = Client()
    monkeypatch.setattr(Client, "execute", mock_return)

    result = execute_query(client, None, None)
    assert result == all_domains_input
