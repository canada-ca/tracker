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
    query getAllDomainsByOrganization {
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


def get_auth_token():
    """Takes in environment variables "TRACKER_UNAME" and "TRACKER_PASS", returns an auth token"""
    transport = AIOHTTPTransport(url="https://tracker.alpha.canada.ca/graphql")
    client = Client(transport=transport)

    username = os.environ.get("TRACKER_UNAME")
    password = os.environ.get("TRACKER_PASS")

    params = {"creds": {"userName": username, "password": password}}

    result = client.execute(SIGNIN_MUTATION, variable_values=params)
    auth_token = result["signIn"]["result"]["authResult"]["authToken"]
    return auth_token


def get_all_domains(auth_token):
    """Takes in an auth token, returns raw JSON result listing all domains you have membership in"""
    transport = AIOHTTPTransport(
        url="https://tracker.alpha.canada.ca/graphql",
        headers={"authorization": auth_token},
    )

    client = Client(transport=transport)

    result = client.execute(ALL_DOMAINS_QUERY)

    # Avert your eyes
    result2 = result["findMyOrganizations"]["edges"]
    result3 = [n["node"] for n in result2]
    for x in result3:
        x["domains"] = x["domains"]["edges"]
        x["domains"] = [n["node"] for n in x["domains"]]
        x["domains"] = [n["domain"] for n in x["domains"]]

    return json.dumps(result3)


def main():
    auth_token = get_auth_token()
    domains = get_all_domains(auth_token)
    print(domains)


if __name__ == "__main__":
    main()
