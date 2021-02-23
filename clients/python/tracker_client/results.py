"""This module provides functions for getting scan results for a domain"""
import json

from core import execute_query
from queries import ALL_RESULTS, WEB_RESULTS, EMAIL_RESULTS, DOMAIN_STATUS
from formatting import (
    format_all_results,
    format_web_results,
    format_email_results,
    format_domain_status,
)


def get_all_results(client, domain):
    """Get all scan results for a domain

    :param Client client: a gql Client object
    :param str domain: domain to get results for
    :return: formatted JSON data with all scan results for the domain
    :rtype: str

    :Example:

    Coming soon, function likely to change
    """
    params = {"domain": domain}

    result = execute_query(client, ALL_RESULTS, params)

    if "error" not in result:
        result = format_all_results(result)

    return json.dumps(result, indent=4)


def get_web_results(client, domain):
    """Get web scan results for a domain

    :param Client client: a gql Client object
    :param str domain: domain to get results for
    :return: formatted JSON data with web scan results for the domain
    :rtype: str

    :Example:

    """
    params = {"domain": domain}

    result = execute_query(client, WEB_RESULTS, params)

    if "error" not in result:
        result = format_web_results(result)

    return json.dumps(result, indent=4)


def get_email_results(client, domain):
    """Get email scan results for a domain

    :param Client client: a gql Client object
    :param str domain: domain to get results for
    :return: formatted JSON data with email scan results for the domain
    :rtype: str

    :Example:

    """
    params = {"domain": domain}

    result = execute_query(client, EMAIL_RESULTS, params)

    if "error" not in result:
        result = format_email_results(result)

    return json.dumps(result, indent=4)


def get_domain_status(client, domain):
    """Return pass/fail status information for a domain

    :param Client client: a gql Client object
    :param str domain: domain to get the status of
    :return: formatted JSON data with the domain's status
    :rtype: str

    :Example:

    >>> import tracker_client.client as tracker_client
    >>> client = tracker_client.create_client(auth_token=tracker_client.get_auth_token())
    >>> print(tracker_client.get_domain_status(client, "foo.bar"))
    {
        "foo.bar": {
            "lastRan": "2021-01-23 22:33:26.921529",
            "status": {
                "https": "FAIL",
                "ssl": "FAIL",
                "dmarc": "PASS",
                "dkim": "PASS",
                "spf": "PASS"
            }
        }
    }
    """
    params = {"domain": domain}

    result = execute_query(client, DOMAIN_STATUS, params)

    if "error" not in result:
        result = format_domain_status(result)

    return json.dumps(result, indent=4)
