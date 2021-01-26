import os
import json

from slugify import slugify
from gql import gql, Client
from gql.transport.aiohttp import AIOHTTPTransport

SIGNIN_MUTATION = gql(
    """
    mutation signIn($creds: SignInInput!) {
        signIn (input: $creds) {
            result {
                ... on RegularSignInResult {
                    authResult {
                        authToken
                    }
                }
            }
        }
    }
    """
)

ALL_DOMAINS_QUERY = gql(
    """
    query getAllDomains {
        findMyOrganizations(first: 100) {
            edges {
                node {
                    acronym
                    domains(first: 100){
                        edges{
                            node{
                                domain
                            }
                        }
                    }     
                }
            }
        }
    }
    """
)

DOMAINS_BY_SLUG = gql(
    """
    query orgBySlug($org: Slug!){
        findOrganizationBySlug(orgSlug: $org){
            domains(first: 100){
                edges{
                    node{
                        domain
                    }
                }
            }
        }
    }
    """
)

DMARC_SUMMARY = gql(
    """
    query domainDMARCSummary(
        $domain: DomainScalar!
        $month: PeriodEnums!
        $year: Year!
    ) {
        findDomainByDomain(domain: $domain) {
            domain
            dmarcSummaryByPeriod(month: $month, year: $year) {
                month
                year
                categoryPercentages {
                    fullPassPercentage
                    passSpfOnlyPercentage
                    passDkimOnlyPercentage
                    failPercentage
                    totalMessages
                }
            }
        }
    }
    """
)

DMARC_YEARLY_SUMMARIES = gql(
    """
    query domainAllDMARCSummaries($domain: DomainScalar!) {
        findDomainByDomain(domain: $domain) {
            domain
            yearlyDmarcSummaries {
                month
                year
                categoryPercentages {
                    fullPassPercentage
                    passSpfOnlyPercentage
                    passDkimOnlyPercentage
                    failPercentage
                    totalMessages
                }
            }
        }
    }
    """
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
            url="https://tracker.alpha.canada.ca/graphql",
            headers={"authorization": auth_token},
        )
    return transport


def create_client(url, auth_token=None):
    """Create and return a gql client object

    Arguments:
    url -- the Tracker GraphQL endpoint url
    auth_token -- JWT auth token string, omit when initially obtaining the token
    """
    if auth_token is None:
        client = Client(
            transport=create_transport(url=url),
            fetch_schema_from_transport=True,
        )
    else:
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


def get_all_domains(auth_token):
    """Takes in an auth token, returns JSON result listing all domains you have membership in"""
    client = create_client(
        url="https://tracker.alpha.canada.ca/graphql",
        auth_token=auth_token,
    )

    result = client.execute(ALL_DOMAINS_QUERY)

    # Extract the list of nodes from the resulting dict
    result_list = result["findMyOrganizations"]["edges"]
    # Move the dict value of "node" up a level
    result_list = [n["node"] for n in result_list]

    # For each dict element of the list, change the value of "domains"
    # to the list of domains contained in the nodes of its edges
    for x in result_list:
        x["domains"] = x["domains"]["edges"]
        x["domains"] = [n["node"] for n in x["domains"]]
        x["domains"] = [n["domain"] for n in x["domains"]]

    # Create a new dict in the desired format to return
    result_dict = {x["acronym"]: {"domains": x["domains"]} for x in result_list}
    return json.dumps(result_dict, indent=4)


def get_domains_by_acronym(acronym, auth_token):
    """Return the domains belonging to the organization identified by acronym

    Arguments:
    acronym -- string containing an acronym belonging to an organization
    auth_token -- JWT auth token string
    """
    # API doesn't allow query by acronym so we filter the get_all_domains result
    all_orgs_result = json.loads(get_all_domains(auth_token))
    result = all_orgs_result[acronym.upper()]
    return json.dumps(result, indent=4)


def get_domains_by_name(name, auth_token):
    """Return the domains belonging to the organization identified by full name

    Arguments:
    name -- string containing the name of an organization
    auth_token -- JWT auth token string
    """
    client = create_client(
        url="https://tracker.alpha.canada.ca/graphql",
        auth_token=auth_token,
    )

    slugified_name = slugify(name)  # API expects a slugified string for name
    params = {"org": slugified_name}

    result = client.execute(DOMAINS_BY_SLUG, variable_values=params)

    # Extract the list of domains from the nested dict response
    result = result["findOrganizationBySlug"]
    result["domains"] = result["domains"]["edges"]
    result["domains"] = [n["node"] for n in result["domains"]]
    result["domains"] = [n["domain"] for n in result["domains"]]

    return json.dumps(result, indent=4)


def get_dmarc_summary(domain, month, year, auth_token):
    """Return the DMARC summary for the specified domain and month

    Arguments:
    domain -- domain name string
    month -- string containing the full name of a month
    year -- positive integer representing a year
    auth_token -- JWT auth token string
    """
    client = create_client(
        url="https://tracker.alpha.canada.ca/graphql",
        auth_token=auth_token,
    )

    params = {"domain": domain, "month": month.upper(), "year": str(year)}

    result = client.execute(DMARC_SUMMARY, variable_values=params)

    result = result["findDomainByDomain"]
    result[result.pop("domain")] = result.pop("dmarcSummaryByPeriod")

    return json.dumps(result, indent=4)


def get_yearly_dmarc_summaries(domain, auth_token):
    """Return all available DMARC summaries for a domain

    Arguments:
    domain -- domain name string
    auth_token -- JWT auth token string
    """
    client = create_client(
        url="https://tracker.alpha.canada.ca/graphql",
        auth_token=auth_token,
    )

    params = {"domain": domain}

    result = client.execute(DMARC_YEARLY_SUMMARIES, variable_values=params)

    result = result["findDomainByDomain"]
    result[result.pop("domain")] = result.pop("yearlyDmarcSummaries")

    return json.dumps(result, indent=4)


def main():
    """main() currently tries all implemented functions and prints results
    for diagnostic purposes
    """
    auth_token = get_auth_token()

    domains = get_all_domains(auth_token)
    print(domains)

    domains = get_domains_by_acronym("cse", auth_token)
    print(domains)

    domains = get_domains_by_name(
        "Communications Security Establishment Canada", auth_token
    )
    print(domains)

    result = get_dmarc_summary("cse-cst.gc.ca", "november", 2020, auth_token)
    print(result)

    result = get_yearly_dmarc_summaries("cse-cst.gc.ca", auth_token)
    print(result)


if __name__ == "__main__":
    main()
