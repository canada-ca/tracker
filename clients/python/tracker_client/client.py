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


# TODO: add other user fields as attributes?
class Client:
    def __init__(self, url="https://tracker.alpha.canada.ca/graphql"):
        self.client = create_client(url, auth_token=get_auth_token())

    def get_organization(self, name):
        "Get an Organization from specified name"
        params = {"orgSlug": slugify(name)}
        result = self.execute_query(queries.GET_ORG, params)

        # TODO: add better treatment of server error message
        if "error" in result:
            print("Server error")
            return

        return Organization.from_org_node(self, result["findOrganizationBySlug"])

    # Consider changing to generator
    def get_organizations(self):
        """Get a list of Organizations for all organizations you are a member of"""
        result = self.execute_query(queries.GET_ALL_ORGS)

        org_list = []

        # TODO: add better treatment of server error message
        if "error" in result:
            print("Server error")
            return org_list

        for edge in result["findMyOrganizations"]["edges"]:
            org_list.append(Organization.from_org_node(self, edge["node"]))

        return org_list

    def get_domain(self, domain):
        """Get a Domain for the given domain"""
        params = {"domain": domain}
        result = self.execute_query(queries.GET_DOMAIN, params)

        # TODO: add better treatment of server error message
        if "error" in result:
            print("Server error")
            return

        dmarc_phase = result["findDomainByDomain"]["dmarcPhase"]
        last_ran = result["findDomainByDomain"]["lastRan"]
        new_domain = Domain(self, domain, last_ran, dmarc_phase)

        return new_domain

    # Consider changing to generator
    def get_domains(self):
        """Get a list of Domains for all domains you own"""
        result = self.execute_query(queries.GET_ALL_DOMAINS)

        domain_list = []

        # TODO: add better treatment of server error message
        if "error" in result:
            print("Server error")
            return domain_list

        for edge in result["findMyDomains"]["edges"]:
            domain = edge["node"]["domain"]
            dmarc_phase = edge["node"]["dmarcPhase"]
            last_ran = edge["node"]["lastRan"]
            domain_list.append(Domain(self, domain, last_ran, dmarc_phase))

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
