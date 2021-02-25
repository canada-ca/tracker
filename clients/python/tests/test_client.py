"""Tests for methods on the Client class"""
import pytest
from gql.transport.exceptions import (
    TransportQueryError,
    TransportServerError,
    TransportProtocolError,
)

from tracker_client.client import Client
import tracker_client.queries as queries


# pylint: disable=no-member
def test_client_execute_query_transport_query_error(mocker):
    """Test that execute_query properly handles an error message from the server"""
    server_error_response = {
        "message": "No organization with the provided slug could be found.",
        "locations": [{"line": 2, "column": 3}],
        "path": ["findOrganizationBySlug"],
        "extensions": {"code": "INTERNAL_SERVER_ERROR"},
    }

    # Stop Client.__init__ from connecting to Tracker
    mocker.patch("tracker_client.client.get_auth_token")
    mocker.patch("tracker_client.client.create_client")
    test_client = Client()
    test_client.client.execute = mocker.MagicMock(
        side_effect=TransportQueryError(
            str(server_error_response),
            errors=[server_error_response],
            data={"foo": None},
        )
    )

    result = test_client.execute_query(None)
    assert result == {
        "error": {"message": "No organization with the provided slug could be found."}
    }


def test_client_execute_query_transport_protocol_error(mocker, capsys):
    """Test that TransportProtocolError is properly re-raised"""
    mocker.patch("tracker_client.client.get_auth_token")
    mocker.patch("tracker_client.client.create_client")
    test_client = Client()
    test_client.client.execute = mocker.MagicMock(side_effect=TransportProtocolError)

    with pytest.raises(TransportProtocolError):
        test_client.execute_query(None)

    # Check that the warning for TransportProtocolError was printed
    captured = capsys.readouterr()
    assert "Unexpected response from server:" in captured.out


def test_client_execute_query_transport_server_error(mocker, capsys):
    """Test that TransportServerError is properly re-raised"""
    mocker.patch("tracker_client.client.get_auth_token")
    mocker.patch("tracker_client.client.create_client")
    test_client = Client()
    test_client.client.execute = mocker.MagicMock(side_effect=TransportServerError)

    with pytest.raises(TransportServerError):
        test_client.execute_query(None)

    # Check that the warning for TransportServerError was printed
    captured = capsys.readouterr()
    assert "Server error:" in captured.out


def test_client_execute_query_other_error(mocker, capsys):
    """Test that other exceptions are properly re-raised"""
    mocker.patch("tracker_client.client.get_auth_token")
    mocker.patch("tracker_client.client.create_client")
    test_client = Client()
    test_client.client.execute = mocker.MagicMock(side_effect=ValueError)

    with pytest.raises(ValueError):
        test_client.execute_query(None)

    # Check that the warning for other errors was printed
    captured = capsys.readouterr()
    assert "Fatal error:" in captured.out


def test_client_execute_query_success(mocker, all_domains_input):
    """Test that a successful response is passed on unchanged"""
    mocker.patch("tracker_client.client.get_auth_token")
    mocker.patch("tracker_client.client.create_client")
    test_client = Client()
    test_client.client.execute = mocker.MagicMock(return_value=all_domains_input)

    result = test_client.execute_query(None)
    assert result == all_domains_input


def test_client_get_organizations(mocker, client_all_orgs_input):
    """Test that Client.get_organizations produces correct output"""
    mocker.patch("tracker_client.client.get_auth_token")
    mocker.patch("tracker_client.client.create_client")
    test_client = Client()
    test_client.execute_query = mocker.MagicMock(return_value=client_all_orgs_input)

    org_list = test_client.get_organizations()

    test_client.execute_query.assert_called_once_with(queries.GET_ALL_ORGS)
    assert org_list[0].acronym == "FOO"
    assert org_list[1].name == "Fizz Bang"
    assert org_list[0].domain_count == 10
    assert org_list[1].verified == True


def test_client_get_organizations_error(mocker, error_message, capsys):
    """Test that Client.get_organizations correctly handles error response"""
    mocker.patch("tracker_client.client.get_auth_token")
    mocker.patch("tracker_client.client.create_client")
    test_client = Client()
    test_client.execute_query = mocker.MagicMock(return_value=error_message)

    with pytest.raises(ValueError, match=r"Unable to get your organizations"):
        test_client.get_organizations()

    captured = capsys.readouterr()
    assert "Server error:" in captured.out


def test_client_get_organization(mocker, client_org_input):
    """Test that Client.get_organization produces correct output"""
    mocker.patch("tracker_client.client.get_auth_token")
    mocker.patch("tracker_client.client.create_client")
    test_client = Client()
    test_client.execute_query = mocker.MagicMock(return_value=client_org_input)

    org = test_client.get_organization("Foo Bar")

    test_client.execute_query.assert_called_once_with(
        queries.GET_ORG, {"orgSlug": "foo-bar"}
    )
    assert org.acronym == "FOO"
    assert org.name == "Foo Bar"
    assert org.zone == "FED"
    assert org.sector == "TBS"
    assert org.country == "Canada"
    assert org.province == "Ontario"
    assert org.city == "Ottawa"
    assert org.domain_count == 10
    assert org.verified


def test_client_get_organization_error(mocker, error_message, capsys):
    """Test that Client.get_organization correctly handles error response"""
    mocker.patch("tracker_client.client.get_auth_token")
    mocker.patch("tracker_client.client.create_client")
    test_client = Client()
    test_client.execute_query = mocker.MagicMock(return_value=error_message)

    with pytest.raises(ValueError, match=r"Unable to get organization Foo Bar"):
        test_client.get_organization("Foo Bar")

    captured = capsys.readouterr()
    assert "Server error:" in captured.out


def test_client_get_domains(mocker, client_all_domains_input):
    """Test that Client.get_domains produces correct output"""
    mocker.patch("tracker_client.client.get_auth_token")
    mocker.patch("tracker_client.client.create_client")
    test_client = Client()
    test_client.execute_query = mocker.MagicMock(return_value=client_all_domains_input)

    domain_list = test_client.get_domains()

    test_client.execute_query.assert_called_once_with(queries.GET_ALL_DOMAINS)
    assert domain_list[0].domain_name == "foo.bar"
    assert domain_list[1].dmarc_phase == "not implemented"
    assert domain_list[2].last_ran == "2021-01-27 23:24:26.911236"
    assert domain_list[0].dkim_selectors == []


def test_client_get_domains_error(mocker, error_message, capsys):
    """Test that Client.get_domains correctly handles error response"""
    mocker.patch("tracker_client.client.get_auth_token")
    mocker.patch("tracker_client.client.create_client")
    test_client = Client()
    test_client.execute_query = mocker.MagicMock(return_value=error_message)

    with pytest.raises(ValueError, match=r"Unable to get your domains"):
        test_client.get_domains()

    captured = capsys.readouterr()
    assert "Server error:" in captured.out


def test_client_get_domain(mocker, client_domain_input):
    """Test that Client.get_domain produces correct output"""
    mocker.patch("tracker_client.client.get_auth_token")
    mocker.patch("tracker_client.client.create_client")
    test_client = Client()
    test_client.execute_query = mocker.MagicMock(return_value=client_domain_input)

    domain = test_client.get_domain("foo.bar")

    test_client.execute_query.assert_called_once_with(
        queries.GET_DOMAIN, {"domain": "foo.bar"}
    )
    assert domain.domain_name == "foo.bar"
    assert domain.dmarc_phase == "not implemented"
    assert domain.last_ran == "2021-01-27 23:24:26.911236"
    assert domain.dkim_selectors == []


def test_client_get_domain_error(mocker, error_message, capsys):
    """Test that Client.get_domains correctly handles error response"""
    mocker.patch("tracker_client.client.get_auth_token")
    mocker.patch("tracker_client.client.create_client")
    test_client = Client()
    test_client.execute_query = mocker.MagicMock(return_value=error_message)

    with pytest.raises(ValueError, match=r"Unable to get domain foo.bar"):
        test_client.get_domain("foo.bar")

    captured = capsys.readouterr()
    assert "Server error:" in captured.out
