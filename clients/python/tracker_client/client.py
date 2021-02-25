"""This module defines the Client class, used to connect to the Tracker API"""
from slugify import slugify
from gql.transport.exceptions import (
    TransportQueryError,
    TransportServerError,
    TransportProtocolError,
)

import queries
from core import create_client, get_auth_token
from domain import Domain
from organization import Organization


class Client:
    """This class represents the user's connection to Tracker, which is established on instantiation.
    It allows the user to retrieve :class:`tracker_client.organization.Organization` and
    :class:`tracker_client.domain.Domain` objects representing organizations they are members of
    and domains their organization(s) control.

    :param str url: Tracker GraphQL endpoint, defaults to alpha endpoint
    :attribute GQL Client client: GQL client instance used to execute queries
    """

    def __init__(self, url="https://tracker.alpha.canada.ca/graphql"):
        self.client = create_client(url, auth_token=get_auth_token())

    def get_organization(self, name):
        """Get an Organization from specified name. You must be a member of that
        organization.

        :param str name: name of organization to get and construct Organization for.
        :return: A :class:`tracker_client.organization.Organization` object
        :rtype: Organization
        """
        params = {"orgSlug": slugify(name)}
        result = self.execute_query(queries.GET_ORG, params)

        if "error" in result:
            print("Server error: ", result)
            raise ValueError("Unable to get organization " + name)

        return Organization(self, **result["findOrganizationBySlug"])

    # Consider changing to generator
    def get_organizations(self):
        """Gets a list of Organizations for all organizations you are a member of

        :return: A list of :class:`tracker_client.organization.Organization` objects
        :rtype: list[Organization]
        """
        result = self.execute_query(queries.GET_ALL_ORGS)

        if "error" in result:
            print("Server error: ", result)
            raise ValueError("Unable to get your organizations.")

        org_list = []
        for edge in result["findMyOrganizations"]["edges"]:
            org_list.append(Organization(self, **edge["node"]))

        return org_list

    def get_domain(self, domain):
        """Get a Domain for the given domain. One of your organizations must
        control that domain

        :param str domain: name of domain to get and construct Domain for.
        :return: A :class:`tracker_client.domain.Domain` object
        :rtype: Domain
        """
        params = {"domain": domain}
        result = self.execute_query(queries.GET_DOMAIN, params)

        if "error" in result:
            print("Server error: ", result)
            raise ValueError("Unable to get domain " + domain)

        return Domain(self, **result["findDomainByDomain"])

    # Consider changing to generator
    def get_domains(self):
        """Gets a list of Domains for all domains your organizations control

        :return: A list of :class:`tracker_client.domain.Domain` objects
        :rtype: list[Domain]
        """
        result = self.execute_query(queries.GET_ALL_DOMAINS)

        if "error" in result:
            print("Server error: ", result)
            raise ValueError("Unable to get your domains.")

        domain_list = []
        for edge in result["findMyDomains"]["edges"]:
            domain_list.append(Domain(self, **edge["node"]))

        return domain_list

    def execute_query(self, query, params=None):
        """Executes a query on this client, with given parameters.

        Intended for internal use, but if for some reason you need an unformatted
        response from the API you could call this.

        :param DocumentNode query: a gql query string that has been parsed with gql()
        :param dict params: variables to pass along with query
        :return: Results of executing query on API
        :rtype: dict
        :raises TransportProtocolError: if server response is not GraphQL
        :raises TransportServerError: if there is a server error
        :raises Exception: if any unhandled exception is raised within function"""
        try:
            result = self.client.execute(query, variable_values=params)

        except TransportQueryError as error:
            # Not sure this is the best way to deal with this exception
            result = {"error": {"message": error.errors[0]["message"]}}

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
