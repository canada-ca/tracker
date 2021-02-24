import json

from slugify import slugify

import domain as dom
from formatting import format_name_summary
import queries


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
        domainCount,
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
        self.domain_count = domainCount

    def get_summary(self):
        """Get summary metrics for this Organization

        :return: formatted JSON data with summary metrics for an organization
        :rtype: str

        :Example:

        >>> from tracker_client.client import Client
        >>> client = Client()
        >>> my_orgs = client.get_organizations()
        >>> print(my_orgs[0].get_summary())
        {
            "FOO": {
                "domainCount": 10,
                "summaries": {
                    "web": {
                        "total": 10,
                        "categories": [
                            {
                                "name": "pass",
                                "count": 1,
                                "percentage": 10
                            },
                            {
                                "name": "fail",
                                "count": 9,
                                "percentage": 90
                            }
                        ]
                    },
                    "mail": {
                        "total": 10,
                        "categories": [
                            {
                                "name": "pass",
                                "count": 5,
                                "percentage": 50
                            },
                            {
                                "name": "fail",
                                "count": 5,
                                "percentage": 50
                            }
                        ]
                    }
                }
            }
        }
        """
        params = {"orgSlug": slugify(self.name)}

        result = self.client.execute_query(queries.SUMMARY_BY_SLUG, params)

        if "error" not in result:
            result = format_name_summary(result)

        return json.dumps(result, indent=4)

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
            domain_list.append(dom.Domain(self.client, **edge["node"]))

        return domain_list
