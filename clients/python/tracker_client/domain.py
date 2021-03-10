"""This module defines the Domain class, which models domains monitored by Tracker
and offers methods to get data about domains."""
import json

import formatting
import organization as org
import queries


class Domain:
    """Class that represents a domain in Tracker.

    Instance variables provide access to scalar fields for the domain in the GraphQL schema,
    while methods return JSON data for non-scalar fields. Users should not typically
    instantiate this class manually, instead use methods provided by
    :class:`~tracker_client.client.Client` to get Domains.

    The naming irregularity between :meth:`__init__`  parameters and instance variables is to match
    parameter names to the keys contained in the API responses. This allows easy
    use of dict unpacking when creating a Domain instance. Instance variable names instead
    adhere to Python convention.

    :ivar Client client: the :class:`~tracker_client.client.Client` that created
        this object. Provides a way for Domain methods to execute queries.
    :ivar str domain: name of the domain.
    :ivar str last_ran: timestamp for last scan run on the domain.
    :ivar str dmarc_phase: DMARC implementation phase. # TODO: Add ref. to relevant docs
    :ivar List[str] dkim_selectors: DKIM selector strings associated with the domain. # TODO: Add ref. to relevant docs
    """

    def __init__(self, client, domain, lastRan, dmarcPhase, selectors):
        """
        :param Client client: As in class docstring.
        :param str domain: sets domain_name.
        :param str lastRan: sets last_ran.
        :param str dmarcPhase: sets dmarc_phase.
        :param List[str] selectors: sets dkim_selectors.
        """
        self.client = client
        self.domain_name = domain
        self.last_ran = lastRan
        self.dmarc_phase = dmarcPhase
        self.dkim_selectors = selectors

    def __str__(self):
        return self.domain_name

    def __repr__(self):
        return (
            "Domain(client=%r, domain=%r, lastRan=%r, dmarcPhase=%r, selectors=%r)"
            % (
                self.client,
                self.domain_name,
                self.last_ran,
                self.dmarc_phase,
                self.dkim_selectors,
            )
        )

    def get_status(self):
        """Return pass/fail status information for this Domain.

        :return: formatted JSON data containing the domain's status.
        :rtype: str

        :Example:

        >>> from tracker_client.client import Client
        >>> client = Client()
        >>> my_domains = client.get_domains()
        >>> print(my_domains[0].get_status())
        {
            "foo.bar": {
                "lastRan": "2021-01-23 22:33:26.921529",
                "status": {
                    "https": "FAIL",
                    "ssl": "FAIL",
                    "dmarc": "PASS",
                    "dkim": "PASS",
                    "spf": "PASS"
                }
            }
        }
        """
        params = {"domain": self.domain_name}
        result = self.client.execute_query(queries.DOMAIN_STATUS, params)

        if "error" not in result:
            result = formatting.format_domain_status(result)

        return json.dumps(result, indent=4)

    def get_monthly_dmarc_summary(self, month, year):
        """Get the DMARC summary for the specified month and year.

        :param str month: the full name of a month.
        :param int year: positive integer representing a year.
        :return: formatted JSON data containing a DMARC summary.
        :rtype: str

        :Example:

        >>> from tracker_client.client import Client
        >>> client = Client()
        >>> foobar = client.get_domain("foo.bar")
        >>> print(foobar.get_monthly_dmarc("september", 2020))
        {
            "foo.bar": {
                "month": "SEPTEMBER",
                "year": "2020",
                "categoryPercentages": {
                    "fullPassPercentage": 87,
                    "passSpfOnlyPercentage": 0,
                    "passDkimOnlyPercentage": 6,
                    "failPercentage": 8,
                    "totalMessages": 10534
                }
            }
        }
        """
        params = {"domain": self.domain_name, "month": month.upper(), "year": str(year)}
        result = self.client.execute_query(queries.DMARC_SUMMARY, params)

        if "error" not in result:
            result = formatting.format_dmarc_monthly(result)

        return json.dumps(result, indent=4)

    def get_yearly_dmarc_summaries(self):
        """Get yearly DMARC summaries for a domain.

        :return: formatted JSON data containing yearly DMARC summaries.
        :rtype: str

        :Example:

        Output is truncated, you should expect more than 2 reports in the list.

        >>> from tracker_client.client import Client
        >>> client = Client()
        >>> foobar = client.get_domain("foo.bar")
        >>> print(foobar.get_yearly_dmarc())
        {
            "foo.bar": [
                {
                    "month": "AUGUST",
                    "year": "2020",
                    "categoryPercentages": {
                        "fullPassPercentage": 90,
                        "passSpfOnlyPercentage": 0,
                        "passDkimOnlyPercentage": 5,
                        "failPercentage": 5,
                        "totalMessages": 7045
                    }
                },
                {
                    "month": "JULY",
                    "year": "2020",
                    "categoryPercentages": {
                        "fullPassPercentage": 82,
                        "passSpfOnlyPercentage": 0,
                        "passDkimOnlyPercentage": 11,
                        "failPercentage": 8,
                        "totalMessages": 6647
                    }
                },
            ]
        }
        """
        params = {"domain": self.domain_name}
        result = self.client.execute_query(queries.DMARC_YEARLY_SUMMARIES, params)

        if "error" not in result:
            result = formatting.format_dmarc_yearly(result)

        return json.dumps(result, indent=4)

    def get_all_results(self, all_scans=False):
        """Get web and email scan results for this Domain.

        :param bool all_scans: if True, get all scans. If False, get only most recent.
        :return: formatted JSON data containing all scan results for the domain.
        :rtype: str

        :Example:

        """
        num_results = 100 if all_scans else 1
        params = {"domain": self.domain_name, "first": num_results}
        result = self.client.execute_query(queries.ALL_RESULTS, params)

        if "error" not in result:
            result = formatting.format_all_results(result)

        return json.dumps(result, indent=4)

    def get_web_results(self, all_scans=False):
        """Get web scan results for this Domain.

        :param bool all_scans: if True, get all scans. If False, get only most recent.
        :return: formatted JSON data containing web scan results for the domain.
        :rtype: str

        :Example:

        """
        num_results = 100 if all_scans else 1
        params = {"domain": self.domain_name, "first": num_results}
        result = self.client.execute_query(queries.WEB_RESULTS, params)

        if "error" not in result:
            result = formatting.format_web_results(result)

        return json.dumps(result, indent=4)

    def get_email_results(self, all_scans=False):
        """Get email scan results for this Domain.

        :param bool all_scans: if True, get all scans. If False, get only most recent.
        :return: formatted JSON data containing email scan results for the domain.
        :rtype: str

        :Example:

        """
        num_results = 100 if all_scans else 1
        params = {"domain": self.domain_name, "first": num_results}
        result = self.client.execute_query(queries.EMAIL_RESULTS, params)

        if "error" not in result:
            result = formatting.format_email_results(result)

        return json.dumps(result, indent=4)

    def get_owners(self):
        """Get a list of Organizations that control this domain

        :return: A list of one or more :class:`organization(s) <tracker_client.organization.Organization>`
            responsible for this domain.
        :rtype: list[Organization]
        """
        params = {"domain": self.domain_name}
        result = self.client.execute_query(queries.GET_DOMAIN_OWNERS, params)

        if "error" in result:
            print("Server error: ", result)
            raise ValueError("Unable to get owners for " + self.domain_name)

        org_list = []
        for edge in result["findDomainByDomain"]["organizations"]["edges"]:
            org_list.append(org.Organization(self.client, **edge["node"]))

        return org_list
