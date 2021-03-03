"""This module defines the Domain class, which models organizations monitored by Tracker
and offers methods to get data about them."""
import json

from slugify import slugify

import domain as dom
from formatting import format_summary
import queries


class Organization:
    """Class that represents an organization in Tracker.

    Instance variables provide access to scalar fields for the organization in the GraphQL schema,
    while methods return JSON data for non-scalar fields. Users should not typically
    instantiate this class manually, instead use methods provided by
    :class:`~tracker_client.client.Client` to get Organizations.

    The naming irregularity between :meth:`__init__` parameters and instance variables is to match
    parameter names to the keys contained in the API responses. This allows easy
    use of dict unpacking when creating an Organization instance. Instance variable names instead
    adhere to Python convention.

    :ivar Client client: the :class:`~tracker_client.client.Client` that created
        this object. Provides a way for Organization methods to execute queries.
    :ivar str name: full name of the organization.
    :ivar str acronym: acronym for the organization.
    :ivar str zone: the zone the organization belongs to.
    :ivar str sector: the sector the organization belongs to.
    :ivar str country: country the organization resides in.
    :ivar str province: province the organization resides in.
    :ivar str city: city the organization resides in.
    :ivar bool verified: if the organization is verified or not.
    :ivar int domainCount: number of domains controlled by the organization.
    :ivar int domain_count: the instance variable containing the domainCount value.
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
        """
        :param Client client: see class docstring.
        :param str name: see class docstring.
        :param str acronym: see class docstring.
        :param str zone: see class docstring.
        :param str sector: see class docstring.
        :param str country: see class docstring.
        :param str province: see class docstring.
        :param str city: see class docstring.
        :param bool verified: see class docstring.
        :param int domainCount: sets domain_count.
        """ 
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

    def __str__(self):
        return self.acronym + " " + self.name

    def __repr__(self):
        return "Organization(client=%r, name=%r, acronym=%r, zone=%r, sector=%r, country=%r, province=%r, city=%r, verified=%r, domain_count=%r)" % (
            self.client,
            self.name,
            self.acronym,
            self.zone,
            self.sector,
            self.country,
            self.province,
            self.city,
            self.verified,
            self.domain_count,
        )

    def get_summary(self):
        """Get summary metrics for this Organization.

        :return: formatted JSON data containing summary metrics for an organization.
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
            result = format_summary(result)

        return json.dumps(result, indent=4)

    # Consider changing to generator
    def get_domains(self):
        """Get a list of Domains controlled by this Organization.

        :return: list of :class:`domains <tracker_client.domain.Domain>` controlled by
            this Organization.
        :rtype: List[Domain]
        """
        params = {"orgSlug": slugify(self.name)}
        result = self.client.execute_query(queries.GET_ORG_DOMAINS, params)

        if "error" in result:
            print("Server error: ", result)
            raise ValueError("Unable to get domains for " + self.name)

        domain_list = []
        for edge in result["findOrganizationBySlug"]["domains"]["edges"]:
            domain_list.append(dom.Domain(self.client, **edge["node"]))

        return domain_list
