"""Provides functions that get JSON data from Tracker (https://github.com/canada-ca/tracker)"""

import json
import os

# TODO: decide if we should just import whole modules instead
from queries import (
    ALL_RESULTS,
    WEB_RESULTS,
    EMAIL_RESULTS,
    DOMAIN_STATUS,
)
from formatting import (
    format_all_results,
    format_web_results,
    format_email_results,
    format_domain_status,
)
from core import create_client, execute_query, get_auth_token
from domains import get_all_domains, get_domains_by_acronym, get_domains_by_name
from dmarc import get_dmarc_summary, get_yearly_dmarc_summaries
from summary import get_all_summaries, get_summary_by_acronym, get_summary_by_name




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


def main():  # pragma: no cover
    """main() currently tries all implemented functions and prints results
    for diagnostic purposes and to demo available features. To be removed in future.
    """
    acronym = "cse"
    name = "Communications Security Establishment Canada"
    domain = "cse-cst.gc.ca"

    print("Tracker account: " + os.environ.get("TRACKER_UNAME"))
    client = create_client(auth_token=get_auth_token())

    print("Getting all your domains...")
    domains = get_all_domains(client)
    print(domains)

    print("Getting domains by acronym " + acronym + "...")
    domains = get_domains_by_acronym(client, acronym)
    print(domains)

    print("Getting domains by name " + name + "...")
    domains = get_domains_by_name(client, name)
    print(domains)

    print("Getting a dmarc summary for " + domain + "...")
    result = get_dmarc_summary(client, domain, "november", 2020)
    print(result)

    print("Getting yearly dmarc summary for " + domain + "...")
    result = get_yearly_dmarc_summaries(client, domain)
    print(result)

    print("Getting summaries for all your organizations...")
    summaries = get_all_summaries(client)
    print(summaries)

    print("Getting summary by acronym " + acronym + "...")
    summaries = get_summary_by_acronym(client, acronym)
    print(summaries)

    print("Getting summary by name " + name + "...")
    summaries = get_summary_by_name(client, name)
    print(summaries)

    print("Getting all scan results for " + domain + "...")
    results = get_all_results(client, domain)
    print(results)

    print("Getting web scan results for " + domain + "...")
    results = get_web_results(client, domain)
    print(results)

    print("Getting email scan results for " + domain + "...")
    results = get_email_results(client, domain)
    print(results)

    print("Getting domain status for " + domain + "...")
    results = get_domain_status(client, domain)
    print(results)


if __name__ == "__main__":  # pragma: no cover
    main()
