from slugify import slugify

import queries
import domain as dom
from summary import get_summary_by_name


class Organization:
    """Class that represents an organization in Tracker """
    def __init__(
        self,
        client,
        name,
        acronym,
        zone,
        sector,
        country,
        province,
        city,
        verified,
        domain_count,
    ):
        self.client = client
        self.name = name
        self.acronym = acronym
        self.zone = zone
        self.sector = sector
        self.country = country
        self.province = province
        self.city = city
        self.verified = verified
        self.domain_count = domain_count

    @classmethod
    def from_org_node(cls, client, node):
        """ Alternate constructor, returns an Organization given Client and GraphQL node containing an organization"""
        args = [
            node["name"],
            node["acronym"],
            node["zone"],
            node["sector"],
            node["country"],
            node["province"],
            node["city"],
            node["verified"],
            node["domainCount"],
        ]
        return cls(client, *args)

    def get_summary(self):
        # Temporary, will move actual function here soon
        return get_summary_by_name(self.client.client, self.name)

    # Consider changing to generator
    def get_domains(self):
        """Get a list of Domains controlled by this organization"""
        params = {"orgSlug": slugify(self.name)}
        result = self.client.execute_query(queries.GET_ORG_DOMAINS, params)

        domain_list = []

        # TODO: add better treatment of server error message
        if "error" in result:
            print("Server error")
            return domain_list

        for edge in result["findOrganizationBySlug"]["domains"]["edges"]:
            domain = edge["node"]["domain"]
            dmarc_phase = edge["node"]["dmarcPhase"]
            last_ran = edge["node"]["lastRan"]
            domain_list.append(dom.Domain(self.client, domain, last_ran, dmarc_phase))

        return domain_list
