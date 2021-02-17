import json

from slugify import slugify

from core import execute_query
from formatting import format_all_domains, format_acronym_domains, format_name_domains
from queries import ALL_DOMAINS_QUERY, DOMAINS_BY_SLUG


def get_all_domains(client):
    """Get lists of all domains you have ownership of, with org as key

    :param Client client: a gql Client object
    :return: formatted JSON data with all organizations and their domains
    :rtype: str

    :Example:

    >>> import tracker_client.client as tracker_client
    >>> client = tracker_client.create_client(auth_token=tracker_client.get_auth_token())
    >>> print(tracker_client.get_all_domains(client))
    {
        "FOO": [
            "foo.bar",
            "foo.bar.baz"
        ],
        "BAR": [
            "fizz.buzz",
            "buzz.bang",
            "ab.cd.ef",
        ]
    }
    """
    result = execute_query(client, ALL_DOMAINS_QUERY)
    # If there is an error the result contains the key "error"
    if "error" not in result:
        result = format_all_domains(result)

    return json.dumps(result, indent=4)


def get_domains_by_acronym(client, acronym):
    """Get the domains belonging to the organization identified by acronym

    :param Client client: a gql Client object
    :param str acronym: an acronym referring to an organization
    :return: formatted JSON data with an organization's domains
    :rtype: str

    :Example:

    >>> import tracker_client.client as tracker_client
    >>> client = tracker_client.create_client(auth_token=tracker_client.get_auth_token())
    >>> print(tracker_client.get_domains_by_acronym(client, "foo"))
    {
        "FOO": [
            "foo.bar",
            "foo.bar.baz"
        ]
    }
    """
    # API doesn't allow query by acronym so we filter the get_all_domains result
    result = execute_query(client, ALL_DOMAINS_QUERY)

    if "error" not in result:
        # Since the server doesn't see the acronym we check if it's in the result
        # and simulate the server error response if it's not there
        try:
            result = format_acronym_domains(result, acronym)

        except KeyError:
            result = {
                "error": {
                    "message": "No organization with the provided acronym could be found."
                }
            }

    return json.dumps(result, indent=4)


def get_domains_by_name(client, name):
    """Get the domains belonging to the organization identified by name

    :param Client client: a gql Client object
    :param str name: the full name of an organization
    :return: formatted JSON data with an organization's domains
    :rtype: str

    :Example:

    >>> import tracker_client.client as tracker_client
    >>> client = tracker_client.create_client(auth_token=tracker_client.get_auth_token())
    >>> print(tracker_client.get_domains_by_name(client, "foo bar"))
    {
        "FOO": [
            "foo.bar",
            "foo.bar.baz"
        ]
    }
    """
    slugified_name = slugify(name)  # API expects a slugified string for name
    params = {"orgSlug": slugified_name}

    result = execute_query(client, DOMAINS_BY_SLUG, params)

    if "error" not in result:
        result = format_name_domains(result)

    return json.dumps(result, indent=4)
