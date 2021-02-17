"""Provides functions that get JSON data from Tracker (https://github.com/canada-ca/tracker)"""

import json
import os

from slugify import slugify

# TODO: decide if we should just import whole modules instead
from queries import (
    DMARC_SUMMARY,
    DMARC_YEARLY_SUMMARIES,
    ALL_ORG_SUMMARIES,
    SUMMARY_BY_SLUG,
    ALL_RESULTS,
    WEB_RESULTS,
    EMAIL_RESULTS,
    DOMAIN_STATUS,
)
from formatting import (
    format_dmarc_monthly,
    format_dmarc_yearly,
    format_all_summaries,
    format_acronym_summary,
    format_name_summary,
    format_all_results,
    format_web_results,
    format_email_results,
    format_domain_status,
)
from core import create_client, execute_query, get_auth_token
from domains import get_all_domains, get_domains_by_acronym, get_domains_by_name




def get_dmarc_summary(client, domain, month, year):
    """Get the DMARC summary for the specified domain and month

    :param Client client: a gql Client object
    :param str domain: the domain to get a DMARC summary for
    :param str month: the full name of a month
    :param int year: positive integer representing a year
    :return: formatted JSON data with a DMARC summary
    :rtype: str

    :Example:

    >>> import tracker_client.client as tracker_client
    >>> client = tracker_client.create_client(auth_token=tracker_client.get_auth_token())
    >>> print(tracker_client.get_dmarc_summary(client, "foo.bar", "september", 2020))
    {
        "foo.bar": {
            "month": "SEPTEMBER",
            "year": "2020",
            "categoryPercentages": {
                "fullPassPercentage": 87,
                "passSpfOnlyPercentage": 0,
                "passDkimOnlyPercentage": 6,
                "failPercentage": 8,
                "totalMessages": 10534
            }
        }
    }
    """
    params = {"domain": domain, "month": month.upper(), "year": str(year)}

    result = execute_query(client, DMARC_SUMMARY, params)

    if "error" not in result:
        result = format_dmarc_monthly(result)

    return json.dumps(result, indent=4)


def get_yearly_dmarc_summaries(client, domain):
    """Get yearly DMARC summaries for a domain

    :param Client client: a gql Client object
    :param str domain: domain to get DMARC summaries for
    :return: formatted JSON data with yearly DMARC summaries
    :rtype: str

    :Example:

    Output is truncated, you should expect more than 2 reports in the list

    >>> import tracker_client.client as tracker_client
    >>> client = tracker_client.create_client(auth_token=tracker_client.get_auth_token())
    >>> print(tracker_client.get_yearly_dmarc_summaries(client, "foo.bar"))
    {
        "foo.bar": [
            {
                "month": "AUGUST",
                "year": "2020",
                "categoryPercentages": {
                    "fullPassPercentage": 90,
                    "passSpfOnlyPercentage": 0,
                    "passDkimOnlyPercentage": 5,
                    "failPercentage": 5,
                    "totalMessages": 7045
                }
            },
            {
                "month": "JULY",
                "year": "2020",
                "categoryPercentages": {
                    "fullPassPercentage": 82,
                    "passSpfOnlyPercentage": 0,
                    "passDkimOnlyPercentage": 11,
                    "failPercentage": 8,
                    "totalMessages": 6647
                }
            },
        ]
    }
    """
    params = {"domain": domain}

    result = execute_query(client, DMARC_YEARLY_SUMMARIES, params)

    if "error" not in result:
        result = format_dmarc_yearly(result)

    return json.dumps(result, indent=4)


def get_all_summaries(client):
    """Get summary metrics for all organizations you are a member of.

    :param Client client: a gql Client object
    :return: formatted JSON data with all organizations and their metrics
    :rtype: str

    :Example:

    >>> import tracker_client.client as tracker_client
    >>> client = tracker_client.create_client(auth_token=tracker_client.get_auth_token())
    >>> print(tracker_client.get_all_summaries(client))
    {
        "FOO": {
            "domainCount": 10,
            "summaries": {
                "web": {
                    "total": 10,
                    "categories": [
                        {
                            "name": "pass",
                            "count": 1,
                            "percentage": 10
                        },
                        {
                            "name": "fail",
                            "count": 9,
                            "percentage": 90
                        }
                    ]
                },
                "mail": {
                    "total": 10,
                    "categories": [
                        {
                            "name": "pass",
                            "count": 5,
                            "percentage": 50
                        },
                        {
                            "name": "fail",
                            "count": 5,
                            "percentage": 50
                        }
                    ]
                }
            }
        },
        "BAR": {
            "domainCount": 10,
            "summaries": {
                "web": {
                    "total": 10,
                    "categories": [
                        {
                            "name": "pass",
                            "count": 5,
                            "percentage": 50
                        },
                        {
                            "name": "fail",
                            "count": 5,
                            "percentage": 50
                        }
                    ]
                },
                "mail": {
                    "total": 10,
                    "categories": [
                        {
                            "name": "pass",
                            "count": 1,
                            "percentage": 10
                        },
                        {
                            "name": "fail",
                            "count": 9,
                            "percentage": 90
                        }
                    ]
                }
            }
        }
    }
    """
    result = execute_query(client, ALL_ORG_SUMMARIES)

    if "error" not in result:
        result = format_all_summaries(result)

    return json.dumps(result, indent=4)


def get_summary_by_acronym(client, acronym):
    """Returns summary metrics for the organization identified by acronym

    :param Client client: a GQL Client object
    :param str acronym: an acronym referring to an organization
    :return: formatted JSON with summary metrics for an organization
    :rtype: str

    :Example:

    >>> import tracker_client.client as tracker_client
    >>> client = tracker_client.create_client(auth_token=tracker_client.get_auth_token())
    >>> print(tracker_client.get_summary_by_acronym(client, "foo"))
    {
        "FOO": {
            "domainCount": 10,
            "summaries": {
                "web": {
                    "total": 10,
                    "categories": [
                        {
                            "name": "pass",
                            "count": 1,
                            "percentage": 10
                        },
                        {
                            "name": "fail",
                            "count": 9,
                            "percentage": 90
                        }
                    ]
                },
                "mail": {
                    "total": 10,
                    "categories": [
                        {
                            "name": "pass",
                            "count": 5,
                            "percentage": 50
                        },
                        {
                            "name": "fail",
                            "count": 5,
                            "percentage": 50
                        }
                    ]
                }
            }
        }
    }
    """
    # API doesn't allow query by acronym so we filter the get_all_summaries result
    result = execute_query(client, ALL_ORG_SUMMARIES)

    if "error" not in result:
        try:
            result = format_acronym_summary(result, acronym)

        except KeyError:
            result = {
                "error": {
                    "message": "No organization with the provided acronym could be found."
                }
            }

    return json.dumps(result, indent=4)


def get_summary_by_name(client, name):
    """Get summary metrics for the organization identified by name

    :param Client client: a gql Client object
    :param str name: the full name of an organization
    :return: formatted JSON data with summary metrics for an organization
    :rtype: str

    :Example:

    >>> import tracker_client.client as tracker_client
    >>> client = tracker_client.create_client(auth_token=tracker_client.get_auth_token())
    >>> print(tracker_client.get_summary_by_name(client, "foo bar"))
    {
        "FOO": {
            "domainCount": 10,
            "summaries": {
                "web": {
                    "total": 10,
                    "categories": [
                        {
                            "name": "pass",
                            "count": 1,
                            "percentage": 10
                        },
                        {
                            "name": "fail",
                            "count": 9,
                            "percentage": 90
                        }
                    ]
                },
                "mail": {
                    "total": 10,
                    "categories": [
                        {
                            "name": "pass",
                            "count": 5,
                            "percentage": 50
                        },
                        {
                            "name": "fail",
                            "count": 5,
                            "percentage": 50
                        }
                    ]
                }
            }
        }
    }
    """
    slugified_name = slugify(name)  # API expects a slugified string for name
    params = {"orgSlug": slugified_name}

    result = execute_query(client, SUMMARY_BY_SLUG, params)

    if "error" not in result:
        result = format_name_summary(result)

    return json.dumps(result, indent=4)


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
