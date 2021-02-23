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
            slugified_name,
            acronym,
            zone,
            sector,
            country,
            province,
            city,
            verified,
            domain_count,
        )

    def get_domain(self, domain):
        params = {"domain": domain}
        result = execute_query(self.client, queries.GET_DOMAIN, params)
        # TODO: deal with server error here

        dmarc_phase = result["findDomainByDomain"]["dmarcPhase"]
        last_ran = result["findDomainByDomain"]["lastRan"]
        new_domain = Domain(self.client, domain, last_ran, dmarc_phase)

        return new_domain


def main():
    session = Client()
    test_domain = session.get_domain("cyber.gc.ca")
    print(test_domain.get_status())

    test_org = session.get_organization("Communications Security Establishment Canada")
    print(test_org.get_summary())


if __name__ == "__main__":  # pragma: no cover
    main()
