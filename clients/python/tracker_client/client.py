import json
import os
import re

from slugify import slugify
from gql import Client
from gql.transport.aiohttp import AIOHTTPTransport
from gql.transport.exceptions import (
    TransportQueryError,
    TransportServerError,
    TransportProtocolError,
)

from queries import (
    ALL_DOMAINS_QUERY,
    DOMAINS_BY_SLUG,
    DMARC_SUMMARY,
    DMARC_YEARLY_SUMMARIES,
    SIGNIN_MUTATION,
    ALL_ORG_SUMMARIES,
    SUMMARY_BY_SLUG,
)


JWT_RE = r"^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$"


def create_transport(url, auth_token=None):
    """Create and return a gql transport object

    Arguments:
    url -- the Tracker GraphQL endpoint url
    auth_token -- JWT auth token string, omit when initially obtaining the token
    """
    if auth_token is None:
        transport = AIOHTTPTransport(url=url)

    else:
        # Resulting stack trace is very unhelpful when passing an invalid token
        # We validate the given auth_token and raise a ValueError if it's invalid
        # to make debugging easier

        if isinstance(auth_token, str) and re.match(JWT_RE, auth_token):
            transport = AIOHTTPTransport(
                url=url,
                headers={"authorization": auth_token},
            )

        else:
            raise ValueError("auth_token is not a valid JWT")

    return transport


def create_client(url, auth_token=None):
    """Create and return a gql client object

    Arguments:
    url -- the Tracker GraphQL endpoint url
    auth_token -- JWT auth token string, omit when initially obtaining the token
    """
    client = Client(
        transport=create_transport(url=url, auth_token=auth_token),
        fetch_schema_from_transport=True,
    )
    return client


def get_auth_token():
    """Takes in environment variables "TRACKER_UNAME" and "TRACKER_PASS", returns an auth token"""
    client = create_client(url="https://tracker.alpha.canada.ca/graphql")

    username = os.environ.get("TRACKER_UNAME")
    password = os.environ.get("TRACKER_PASS")

    if username is None or password is None:
        raise ValueError("Tracker credentials missing from environment.")

    params = {"creds": {"userName": username, "password": password}}

    result = client.execute(SIGNIN_MUTATION, variable_values=params)
    auth_token = result["signIn"]["result"]["authResult"]["authToken"]
    return auth_token


# TODO: Make error messages better
def execute_query(client, query, params=None):
    """Executes a query on given client, with given parameters. """
    try:
        result = client.execute(query, variable_values=params)

    except TransportQueryError as error:
        # Not sure this is the best way to deal with this exception
        print("Error in query:")
        result = error.errors[0]

    except TransportProtocolError as error:
        print("Unexpected response from server:", error)
        raise

    except TransportServerError as error:
        print("Server error:", error)
        raise

    except Exception as error:
        # Need to be more descriptive
        # Potentially figure out other errors that could be caught here?
        print("Fatal error:", error)
        raise

    return result


def get_all_domains(client):
    """Returns lists of all domains you have ownership of, with org as key

    Arguments:
    client -- a GQL Client object
    """
    result = execute_query(client, ALL_DOMAINS_QUERY)
    # Only the server's error response contains the key "message"
    if "message" not in result:
        result = format_all_domains(result)

    return json.dumps(result, indent=4)


def format_all_domains(result):
    """ Formats the dict obtained by ALL_DOMAINS_QUERY """
    # Extract the list of nodes from the resulting dict
    result = result["findMyOrganizations"]["edges"]
    # Move the dict value of "node" up a level
    result = [n["node"] for n in result]

    # For each dict element of the list, change the value of "domains"
    # to the list of domains contained in the nodes of its edges
    for x in result:
        x["domains"] = x["domains"]["edges"]
        x["domains"] = [n["node"] for n in x["domains"]]
        x["domains"] = [n["domain"] for n in x["domains"]]

    # Create a new dict in the desired format to return
    result = {x["acronym"]: {"domains": x["domains"]} for x in result}
    return result


def get_domains_by_acronym(acronym, client):
    """Return the domains belonging to the organization identified by acronym

    Arguments:
    acronym -- string containing an acronym belonging to an organization
    client -- a GQL Client object
    """
    # API doesn't allow query by acronym so we filter the get_all_domains result
    result = execute_query(client, ALL_DOMAINS_QUERY)

    if "message" not in result:
        # Since the server doesn't see the acronym we check if it's in the result
        # and print an error if it's not there
        # TODO This needs to act like a TransportQueryError
        try:
            result = format_acronym_domains(acronym, result)

        except KeyError:
            print("No domains found for acronym:", acronym)

    # Right now this will return all domains if the acronym isn't found
    return json.dumps(result, indent=4)


def format_acronym_domains(acronym, result):
    """ Formats the dict obtained by ALL_DOMAINS_QUERY to show only one org"""
    result = format_all_domains(result)
    result = result[acronym.upper()]
    return result


def get_domains_by_name(name, client):
    """Return the domains belonging to the organization identified by full name

    Arguments:
    name -- string containing the name of an organization
    client -- a GQL Client object
    """
    slugified_name = slugify(name)  # API expects a slugified string for name
    params = {"org": slugified_name}

    result = execute_query(client, DOMAINS_BY_SLUG, params)

    if "message" not in result:
        result = format_name_domains(result)

    return json.dumps(result, indent=4)


def format_name_domains(result):
    """Formats the dict obtained by DOMAINS_BY_SLUG"""
    result = result["findOrganizationBySlug"]
    result["domains"] = result["domains"]["edges"]
    result["domains"] = [n["node"] for n in result["domains"]]
    result["domains"] = [n["domain"] for n in result["domains"]]
    return result


def get_dmarc_summary(domain, month, year, client):
    """Return the DMARC summary for the specified domain and month

    Arguments:
    domain -- domain name string
    month -- string containing the full name of a month
    year -- positive integer representing a year
    client -- a GQL Client object
    """
    params = {"domain": domain, "month": month.upper(), "year": str(year)}

    result = execute_query(client, DMARC_SUMMARY, params)

    if "message" not in result:
        result = format_dmarc_monthly(result)

    return json.dumps(result, indent=4)


def format_dmarc_monthly(result):
    """Formats the dict obtained by DMARC_SUMMARY"""
    result = result["findDomainByDomain"]
    result[result.pop("domain")] = result.pop("dmarcSummaryByPeriod")
    return result


def get_yearly_dmarc_summaries(domain, client):
    """Return yearly DMARC summaries for a domain

    Arguments:
    domain -- domain name string
    client -- a GQL Client object
    """
    params = {"domain": domain}

    result = execute_query(client, DMARC_YEARLY_SUMMARIES, params)

    if "message" not in result:
        result = format_dmarc_yearly(result)

    return json.dumps(result, indent=4)


def format_dmarc_yearly(result):
    """Formats the dict obtained by DMARC_YEARLY_SUMMARIES"""
    result = result["findDomainByDomain"]
    result[result.pop("domain")] = result.pop("yearlyDmarcSummaries")
    return result


def get_all_summaries(client):
    """Returns summary metrics for all organizations you are a member of.

    Arguments:
    client -- a GQL Client object
    """
    result = execute_query(client, ALL_ORG_SUMMARIES)

    if "message" not in result:
        result = format_all_summaries(result)

    return json.dumps(result, indent=4)


def format_all_summaries(result):
    """Formats the dict obtained by ALL_ORG_SUMMARIES"""
    result = result["findMyOrganizations"]["edges"]
    result = {x["node"].pop("acronym"): x["node"] for x in result}
    return result


def get_summary_by_acronym(acronym, client):
    """Returns summary metrics for the organization identified by acronym

    Arguments:
    acronym -- string containing an acronym belonging to an organization
    client -- a GQL Client object
    """
    # API doesn't allow query by acronym so we filter the get_all_summaries result
    result = execute_query(client, ALL_ORG_SUMMARIES)

    if "message" not in result:
        # TODO This needs to act like a TransportQueryError
        try:
            result = format_acronym_summary(result, acronym)
        except KeyError:
            print("No summary found for acronym:", acronym)

    # Right now this will return all domains if the acronym isn't found
    return json.dumps(result, indent=4)


def format_acronym_summary(result, acronym):
    """Formats the dict obtained by ALL_ORG_SUMMARIES to show only one org"""
    result = format_all_summaries(result)
    # dict in assignment is to keep the org identified in the return value
    result = {acronym.upper(): result[acronym.upper()]}
    return result


def get_summary_by_name(name, client):
    """Return summary metrics for the organization identified by name

    Arguments:
    name -- string containing the name of an organization
    client -- a GQL Client object
    """
    slugified_name = slugify(name)  # API expects a slugified string for name
    params = {"orgSlug": slugified_name}

    result = execute_query(client, SUMMARY_BY_SLUG, params)

    if "message" not in result:
        result = format_name_summary(result)

    return json.dumps(result, indent=4)


def format_name_summary(result):
    """Formats the dict obtained by SUMMARY_BY_SLUG"""
    result = {
        result["findOrganizationBySlug"].pop("acronym"): result[
            "findOrganizationBySlug"
        ]
    }
    return result


def main():
    """main() currently tries all implemented functions and prints results
    for diagnostic purposes and to demo available features.
    """
    acronym = "cse"
    name = "Communications Security Establishment Canada"
    domain = "cse-cst.gc.ca"

    print("Tracker account: " + os.environ.get("TRACKER_UNAME"))
    client = create_client("https://tracker.alpha.canada.ca/graphql", get_auth_token())

    print("Getting all your domains...")
    domains = get_all_domains(client)
    print(domains)

    print("Getting domains by acronym " + acronym + "...")
    domains = get_domains_by_acronym(acronym, client)
    print(domains)

    print("Getting domains by name " + name + "...")
    domains = get_domains_by_name(name, client)
    print(domains)

    print("Getting a dmarc summary for " + domain + "...")
    result = get_dmarc_summary(domain, "november", 2020, client)
    print(result)

    print("Getting yearly dmarc summary for " + domain + "...")
    result = get_yearly_dmarc_summaries(domain, client)
    print(result)

    print("Getting summaries for all your organizations...")
    summaries = get_all_summaries(client)
    print(summaries)

    print("Getting summary by acronym " + acronym + "...")
    summaries = get_summary_by_acronym(acronym, client)
    print(summaries)

    print("Getting summary by name " + name + "...")
    summaries = get_summary_by_name(name, client)
    print(summaries)


if __name__ == "__main__":
    main()
