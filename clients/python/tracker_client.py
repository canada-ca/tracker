import os
import json

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
    """Takes in an auth token, returns raw JSON result listing all domains you have membership in"""
    client = create_client(
        url="https://tracker.alpha.canada.ca/graphql",
        auth_token=auth_token,
    )

    result = client.execute(ALL_DOMAINS_QUERY)

    # Extract the list of nodes from the resulting dict
    result_list = result["findMyOrganizations"]["edges"]
    # Move the dict value of "node" up a level
    result_list = [
        n["node"] for n in result_list
    ]  # Move the dict value of "node" up a level

    # For each dict element of the list, change the value of "domains"
    # to the list of domains contained in the nodes of its edges
    for x in result_list:
        x["domains"] = x["domains"]["edges"]
        x["domains"] = [n["node"] for n in x["domains"]]
        x["domains"] = [n["domain"] for n in x["domains"]]

    # Create a new dict in the desired format to return
    result_dict = {x["acronym"]: {"domains": x["domains"]} for x in result_list}
    return json.dumps(result_dict, indent=4)


def main():
    auth_token = get_auth_token()
    domains = get_all_domains(auth_token)
    print(domains)


if __name__ == "__main__":
    main()
