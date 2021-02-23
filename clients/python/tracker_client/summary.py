"""This module provides functions for getting summary metrics about domains"""
import json

from slugify import slugify

from core import execute_query
from queries import ALL_ORG_SUMMARIES, SUMMARY_BY_SLUG
from formatting import format_all_summaries, format_acronym_summary, format_name_summary


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
