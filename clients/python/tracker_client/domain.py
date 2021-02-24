import queries
import organization as org
from results import (
    get_all_results,
    get_domain_status,
    get_email_results,
    get_web_results,
)
from dmarc import get_dmarc_summary, get_yearly_dmarc_summaries


class Domain:
    """Class that represents a domain in tracker"""
    def __init__(self, client, domain_name, last_ran, dmarc_phase):
        self.client = client
        self.domain_name = domain_name
        self.last_ran = last_ran
        self.dmarc_phase = dmarc_phase

    # All the "client.client"s are temporary
    def get_status(self):
        return get_domain_status(self.client.client, self.domain_name)

    def get_monthly_dmarc(self, month, year):
        return get_dmarc_summary(self.client.client, self.domain_name, month, year)

    def get_yearly_dmarc(self):
        return get_yearly_dmarc_summaries(self.client.client, self.domain_name)

    def get_all_results(self):
        return get_all_results(self.client.client, self.domain_name)

    def get_web_results(self):
        return get_web_results(self.client.client, self.domain_name)

    def get_email_results(self):
        return get_email_results(self.client.client, self.domain_name)

    def get_owners(self):
        """Get a list of Organizations that control this domain"""
        params = {"domain": self.domain_name}
        result = self.client.execute_query(
            self.client, queries.GET_DOMAIN_OWNERS, params
        )

        org_list = []

        # TODO: add better treatment of server error message
        if "error" in result:
            print("Server error")
            return org_list

        for edge in result["findDomainByDomain"]["organizations"]["edges"]:
            org_list.append(
                org.Organization.from_org_node(self.client, edge["node"])
            )

        return org_list
