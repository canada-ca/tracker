"""This module defines the Domain class, which models organizations monitored by Tracker
and offers methods to get data about them"""
import json

from slugify import slugify

import domain as dom
from formatting import format_name_summary
import queries


class Organization:
    """Class that represents an organization in Tracker

    Attributes provide access to scalar fields for the organization in the GraphQL schema,
    while methods return JSON data for non-scalar fields. Users should not typically
    instantiate this class manually, instead use methods provided by
    :class:`tracker_client.client.Client` to get Organizations.

    The naming irregularity between parameters and attributes is to match
    parameter names to the keys contained in the API responses. This allows easy
    use of dict unpacking when creating an Organization instance. Attribute names instead
    adhere to Python convention.

    :param Client client: the :class:`tracker_client.client.Client` that created
        this object. Provides a way for Organization methods to execute queries.
    :param str name: full name of the organization.
    :param str acronym: acronym for the organization.
    :param str zone: the zone the organization belongs to.
    :param str sector: the sector the organization belongs to.
    :param str country: country the organization resides in.
    :param str province: province the organization resides in.
    :param str city: city the organization resides in.
    :param bool verified: if the organization is verified or not.
    :param int domainCount: number of domains controlled by the organization.
    """
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
        """Get a list of Domains controlled by this Organization

        :return: list of :class:`tracker_client.domain.Domain`s controlled by
            this Organization
        :rtype: list[:class:`tracker_client.domain.Domain`]
        """
        params = {"orgSlug": slugify(self.name)}
        result = self.client.execute_query(queries.GET_ORG_DOMAINS, params)

        if "error" in result:
            print("Server error: ", result)
            raise ValueError("Unable to get domains for ", self.name)

        domain_list = []
        for edge in result["findOrganizationBySlug"]["domains"]["edges"]:
            domain_list.append(dom.Domain(self.client, **edge["node"]))

        return domain_list
