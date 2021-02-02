import os
import json

from slugify import slugify
from gql import gql, Client
from gql.transport.aiohttp import AIOHTTPTransport

from queries import (
    ALL_DOMAINS_QUERY,
    DOMAINS_BY_SLUG,
    DMARC_SUMMARY,
    DMARC_YEARLY_SUMMARIES,
    SIGNIN_MUTATION,
    ALL_ORG_SUMMARIES,
    SUMMARY_BY_SLUG,
    DOMAIN_RESULTS
)


def create_transport(url, auth_token=None):
    """Create and return a gql transport object

    Arguments:
    url -- the Tracker GraphQL endpoint url
    auth_token -- JWT auth token string, omit when initially obtaining the token
    """
    if auth_token is None:
        transport = AIOHTTPTransport(url=url)
    else:
        transport = AIOHTTPTransport(
            url=url,
            headers={"authorization": auth_token},
        )
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

    params = {"creds": {"userName": username, "password": password}}

    result = client.execute(SIGNIN_MUTATION, variable_values=params)
    auth_token = result["signIn"]["result"]["authResult"]["authToken"]
    return auth_token


def get_all_domains(client):
    """Returns lists of all domains you have ownership of, with org as key

    Arguments:
    client -- a GQL Client object
    """
    result = client.execute(ALL_DOMAINS_QUERY)
    formatted_result = format_all_domains(result)
    return json.dumps(formatted_result, indent=4)


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
    result = client.execute(ALL_DOMAINS_QUERY)
    formatted_result = format_acronym_domains(acronym, result)
    return json.dumps(formatted_result, indent=4)


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

    result = client.execute(DOMAINS_BY_SLUG, variable_values=params)
    formatted_result = format_name_domains(result)
    return json.dumps(formatted_result, indent=4)


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

    result = client.execute(DMARC_SUMMARY, variable_values=params)
    formatted_result = format_dmarc_monthly(result)
    return json.dumps(formatted_result, indent=4)


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

    result = client.execute(DMARC_YEARLY_SUMMARIES, variable_values=params)
    formatted_result = format_dmarc_yearly(result)
    return json.dumps(formatted_result, indent=4)


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
    result = client.execute(ALL_ORG_SUMMARIES)
    formatted_result = format_all_summaries(result)
    return json.dumps(formatted_result, indent=4)


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
    result = client.execute(ALL_ORG_SUMMARIES)
    formatted_result = format_acronym_summary(result, acronym)
    return json.dumps(formatted_result, indent=4)


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

    result = client.execute(SUMMARY_BY_SLUG, variable_values=params)
    formatted_result = format_name_summary(result)
    return json.dumps(formatted_result, indent=4)


def format_name_summary(result):
    """Formats the dict obtained by SUMMARY_BY_SLUG"""
    result = {
        result["findOrganizationBySlug"].pop("acronym"): result[
            "findOrganizationBySlug"
        ]
    }
    return result


def get_domain_results(domain, client):
    """Return scan results for a domain

    Arguments:
    domain -- domain name string
    client -- a GQL Client object
    """
    params = {"domain": domain}

    result = client.execute(DOMAIN_RESULTS, variable_values= params)
    formatted_result = result
    return json.dumps(formatted_result, indent=4)


def main():
    """main() currently tries all implemented functions and prints results
    for diagnostic purposes and to demo available features.
    """
    print("Tracker account: " + os.environ.get("TRACKER_UNAME"))
    client = create_client("https://tracker.alpha.canada.ca/graphql", get_auth_token())

    """print("Getting all your domains...")
    domains = get_all_domains(client)
    print(domains)

    acronym = "cse"
    print("Getting domains by acronym " + acronym + "...")
    domains = get_domains_by_acronym("cse", client)
    print(domains)

    name = "Communications Security Establishment Canada"
    print("Getting domains by name " + name + "...")
    domains = get_domains_by_name(name, client)
    print(domains)

    domain = "cse-cst.gc.ca"
    print("Getting a dmarc summary for " + domain + "...")
    result = get_dmarc_summary(domain, "november", 2020, client)
    print(result)

    print("Getting yearly dmarc summary for " + domain + "...")
    result = get_yearly_dmarc_summaries("cse-cst.gc.ca", client)
    print(result)

    print("Getting summaries for all your organizations...")
    summaries = get_all_summaries(client)
    print(summaries)

    print("Getting summary by acronym " + acronym + "...")
    summaries = get_summary_by_acronym("cse", client)
    print(summaries)

    print("Getting summary by name " + name + "...")
    summaries = get_summary_by_name(name, client)
    print(summaries)"""

    domain = "cse-cst.gc.ca"
    print("Getting scan results for " + domain + "...")
    results = get_domain_results(domain, client)
    print(results)


if __name__ == "__main__":
    main()
