import json

import pytest

from tracker_client.organization import Organization
import tracker_client.queries as queries

# pylint: disable=no-member


@pytest.fixture
def mock_org():
    return {"name": "foo", "acronym": "FOO", "zone": "FED", "sector": "TBS", "country": "Canada", "province":"ON", "city": "Ottawa", "verified": True, "domainCount": 12 }



@pytest.fixture
def org_get_domains_input():
    return {
    "findOrganizationBySlug": {
      "domains": {
        "edges": [
          {
            "node": {
              "domain": "foo.bar",
              "dmarcPhase": "not implemented",
              "lastRan": "2021-01-27 23:24:26.911236",
              "selectors": []
            }
          },
          {
            "node": {
              "domain": "fizz.bang",
              "dmarcPhase": "not implemented",
              "lastRan": "2021-01-27 23:24:26.911236",
              "selectors": []
            }
          },
          {
            "node": {
              "domain": "abc.def",
              "dmarcPhase": "not implemented",
              "lastRan": "2021-01-27 23:24:26.911236",
              "selectors": []
            }
          }
        ]
      }
    }
  }



def test_org_get_summary(mocker, mock_org, name_summary_input, org_summary_output):
    """Test that Organization.get_summary produces correct output"""
    client = mocker.MagicMock(spec="tracker_client.client.Client")
    client.execute_query = mocker.MagicMock(return_value=name_summary_input)
    test_org = Organization(client, **mock_org)
    assert test_org.get_summary() == json.dumps(org_summary_output, indent=4)
    client.execute_query.assert_called_once_with(queries.SUMMARY_BY_SLUG, {"orgSlug": "foo"})


def test_org_get_summary_error(mocker, mock_org, error_message):
    """Test that Organization.get_summary correctly handles error response"""
    client = mocker.MagicMock(spec="tracker_client.client.Client")
    client.execute_query = mocker.MagicMock(return_value=error_message)
    test_org = Organization(client, **mock_org)
    assert test_org.get_summary() == json.dumps(error_message, indent=4)


def test_org_get_domains(mocker, mock_org, org_get_domains_input):
    """Test that Organization.get_domains produces correct output"""
    client = mocker.MagicMock(spec="tracker_client.client.Client")
    client.execute_query = mocker.MagicMock(return_value=org_get_domains_input)

    test_org = Organization(client, **mock_org)
    domain_list = test_org.get_domains()

    assert domain_list[0].domain_name == "foo.bar"
    assert domain_list[1].dmarc_phase == "not implemented"
    assert domain_list[2].last_ran == "2021-01-27 23:24:26.911236"
    assert domain_list[0].dkim_selectors == []


def test_org_get_domains_error(mocker, mock_org, error_message, capsys):
    """Test that Organization.get_domains correctly handles error response"""
    client = mocker.MagicMock(spec="tracker_client.client.Client")
    client.execute_query = mocker.MagicMock(return_value=error_message)

    test_org = Organization(client, **mock_org)
    
    with pytest.raises(ValueError, match=r"Unable to get domains for foo"):
        test_org.get_domains()

    captured = capsys.readouterr()
    assert "Server error:" in captured.out