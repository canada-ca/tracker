import json

from core import execute_query
from queries import DMARC_SUMMARY, DMARC_YEARLY_SUMMARIES
from formatting import format_dmarc_monthly, format_dmarc_yearly


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
