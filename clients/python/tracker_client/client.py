import json

from slugify import slugify

import queries
from core import create_client, get_auth_token, execute_query
from domain import Domain
from organization import Organization


# TODO: add other user fields as attributes?
class Client:
    def __init__(self, url="https://tracker.alpha.canada.ca/graphql"):
        self.client = create_client(url, auth_token=get_auth_token())

    def get_organization(self, name):
        slugified_name = slugify(name)
        params = {"orgSlug": slugified_name}
        result = execute_query(self.client, queries.GET_ORG, params)
        # TODO: deal with server error here

        acronym = result["findOrganizationBySlug"]["acronym"]
        zone = result["findOrganizationBySlug"]["zone"]
        sector = result["findOrganizationBySlug"]["sector"]
        country = result["findOrganizationBySlug"]["country"]
        province = result["findOrganizationBySlug"]["province"]
        city = result["findOrganizationBySlug"]["city"]
        # need to make verified a real bool
        verified = result["findOrganizationBySlug"]["verified"]
        domain_count = result["findOrganizationBySlug"]["domainCount"]

        return Organization(
            self.client,
            name,
            acronym,
            slugified_name,
            zone,
            sector,
            country,
            province,
            city,
            verified,
            domain_count,
        )

    def get_organizations(self):
        result = execute_query(self.client, queries.GET_ALL_ORGS)

        org_list = []

        for edge in result["findMyOrganizations"]["edges"]:

            name = edge["node"]["name"]
            slug = edge["node"]["slug"]
            acronym = edge["node"]["acronym"]
            zone = edge["node"]["zone"]
            sector = edge["node"]["sector"]
            country = edge["node"]["country"]
            province = edge["node"]["province"]
            city = edge["node"]["city"]
            # need to make verified a real bool
            verified = edge["node"]["verified"]
            domain_count = edge["node"]["domainCount"]

            org_list.append(
                Organization(
                    self.client,
                    name,
                    acronym,
                    slug,
                    zone,
                    sector,
                    country,
                    province,
                    city,
                    verified,
                    domain_count,
                )
            )

        return org_list

    def get_domain(self, domain):
        params = {"domain": domain}
        result = execute_query(self.client, queries.GET_DOMAIN, params)
        # TODO: deal with server error here

        dmarc_phase = result["findDomainByDomain"]["dmarcPhase"]
        last_ran = result["findDomainByDomain"]["lastRan"]
        new_domain = Domain(self.client, domain, last_ran, dmarc_phase)

        return new_domain

    def get_domains(self):
        result = execute_query(self.client, queries.GET_ALL_DOMAINS)
        # TODO: deal with server error here

        domain_list = []

        for edge in result["findMyDomains"]["edges"]:
            domain = edge["node"]["domain"]
            dmarc_phase = edge["node"]["dmarcPhase"]
            last_ran = edge["node"]["lastRan"]
            domain_list.append(Domain(self.client, domain, last_ran, dmarc_phase))

        return domain_list


def main():
    session = Client()
    my_domains = session.get_domains()

    dmarc_fails = []
    for domain in my_domains:
        status = json.loads(domain.get_status())

        if status[domain.domain_name]["status"]["dkim"] == "FAIL":
            dmarc_fails.append(domain.domain_name)

    print(dmarc_fails)


if __name__ == "__main__":  # pragma: no cover
    main()
