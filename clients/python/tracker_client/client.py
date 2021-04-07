"""This module defines the Client class, used to connect to the Tracker API."""
from slugify import slugify
from gql.transport.exceptions import (
    TransportQueryError,
    TransportServerError,
    TransportProtocolError,
)
from graphql.error import GraphQLError

from core import create_client, get_auth_token
from domain import Domain
from organization import Organization
import queries


class Client:
    """This class represents the user's connection to Tracker, which is established on instantiation.
    It allows the user to retrieve :class:`~tracker_client.organization.Organization` and
    :class:`~tracker_client.domain.Domain` objects representing organizations they are members of
    and domains their organization(s) control.

    :param str url: Tracker GraphQL endpoint, defaults to alpha endpoint.
    :param str lang: desired language to get data from Tracker in ('en' or 'fr').
    :ivar gql.Client gql_client: gql client instance used to execute queries.
    """

    def __init__(self, url="https://tracker.alpha.canada.ca/graphql", language="en"):
        self.gql_client = create_client(url, get_auth_token(), language)

    def get_organization(self, name):
        """Get an :class:`~tracker_client.organization.Organization` from specified name. You must be a member of that
        organization.

        :param str name: name of organization to get and construct :class:`~tracker_client.organization.Organization` for.
        :return: The specified organization.
        :rtype: Organization
        :raises ValueError: if an invalid organization name is given.
        """
        params = {"orgSlug": slugify(name)}
        result = self.execute_query(queries.GET_ORG, params)

        if "error" in result:
            print("Server error: ", result)
            raise ValueError("Unable to get organization " + name)

        return Organization(self, **result["findOrganizationBySlug"])

    # Consider changing to generator
    def get_organizations(self, search=""):
        """Get a list of your :class:`organizations <tracker_client.organization.Organization>`.

        Note that the optional search term is supplied as part of the GraphQL query variables and
        affects the API response received, rather than filtering results client-side.

        :param str search: Search term to filter results with. For example, supplying
            the string "canada" would return only Organizations containing "canada" in their name.
        :return: A list of your organizations.
        :rtype: list[Organization]
        :raises ValueError: if your organizations can't be retrieved.
        """
        params = {"after": "", "search": search}
        has_next = True
        org_list = []

        # The maximum number of organizations that can be requested at once is 100
        # This loop gets 100 orgs, checks if there are more, and if there are
        # it gets another 100 starting after the last org it got
        while has_next:
            result = self.execute_query(queries.GET_ALL_ORGS, params)

            if "error" in result:
                print("Server error: ", result)
                raise ValueError("Unable to get your organizations.")

            for edge in result["findMyOrganizations"]["edges"]:
                org_list.append(Organization(self, **edge["node"]))

            has_next = result["findMyOrganizations"]["pageInfo"]["hasNextPage"]
            params["after"] = result["findMyOrganizations"]["pageInfo"]["endCursor"]

        return org_list

    def get_domain(self, domain):
        """Get a :class:`~tracker_client.domain.Domain` for the given domain. One of your organizations must
        control that domain.

        :param str domain: name of domain to get and construct Domain for.
        :return: The specified domain.
        :rtype: Domain
        :raises ValueError: if an invalid domain is requested.
        """
        params = {"domain": domain}
        result = self.execute_query(queries.GET_DOMAIN, params)

        if "error" in result:
            print("Server error: ", result)
            raise ValueError("Unable to get domain " + domain)

        return Domain(self, **result["findDomainByDomain"])

    # Consider changing to generator
    def get_domains(self, search=""):
        """Get a list of your :class:`domains <tracker_client.domain.Domain>`.

        Note that the optional search term is supplied as part of the GraphQL query variables and
        affects the API response received, rather than filtering results client-side.

        :param str search: Search term to filter results with. For example, supplying
            the string "abc" would return only Domains containing "abc" in their domain_name.
        :return: A list of your domains.
        :rtype: list[Domain]
        :raises ValueError: if your domains can't be retrieved.
        """
        params = {"after": "", "search": search}
        has_next = True
        domain_list = []

        # The maximum number of domains that can be requested at once is 100
        # This loop gets 100 domains, checks if there are more, and if there are
        # it gets another 100 starting after the last domain it got
        while has_next:
            result = self.execute_query(queries.GET_ALL_DOMAINS, params)

            if "error" in result:
                print("Server error: ", result)
                raise ValueError("Unable to get your domains.")

            for edge in result["findMyDomains"]["edges"]:
                domain_list.append(Domain(self, **edge["node"]))

            has_next = result["findMyDomains"]["pageInfo"]["hasNextPage"]
            params["after"] = result["findMyDomains"]["pageInfo"]["endCursor"]

        return domain_list

    def execute_query(self, query, params=None):
        """Executes a query on this client, with given parameters.

        Intended for internal use, but if for some reason you need an unformatted
        response from the API you could call this.

        :param DocumentNode query: a gql query string that has been parsed with gql().
        :param dict params: variables to pass along with query.
        :return: Results of executing query on API.
        :rtype: dict
        :raises TransportProtocolError: if server response is not GraphQL.
        :raises TransportServerError: if there is a server error.
        :raises GraphQLError: if query validation fails.
        :raises Exception: if any unhandled exception is raised within function"""
        try:
            result = self.gql_client.execute(query, variable_values=params)

        except TransportQueryError as error:
            # Returns a message with all errors and the path where they occurred
            result = {
                "error": [
                    {"message": err["message"], "path": err["path"]}
                    for err in error.errors
                ]
            }

        except TransportProtocolError as error:
            print("Unexpected response from server:", error)
            raise

        except TransportServerError as error:
            print("Server error:", error)
            raise

        # Raised if query validation fails, likely caused by schema changes
        except GraphQLError as error:
            print("Query validation error, client may be out of date:", error)
            raise

        except Exception as error:
            # Need to be more descriptive
            # Potentially figure out other errors that could be caught here?
            print("Fatal error:", error)
            raise

        return result
