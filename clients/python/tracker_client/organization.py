from core import create_client, get_auth_token
from domains import get_domains_by_name
from summary import get_summary_by_name


class Organization:
    # Get list of domains outside and pass in, or fetch list at instantiation?
    def __init__(
        self,
        client,
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
    ):
        self.client = client
        self.name = name
        self.acronym = acronym
        self.slug = slug
        self.zone = zone
        self.sector = sector
        self.country = country
        self.province = province
        self.city = city
        self.verified = verified
        self.domain_count = domain_count

    def get_summary(self):
        # Temporary, will move actual function here soon
        return get_summary_by_name(self.client, self.name)

    # TODO: make this return a list of domain objects and create another function for JSON output
    def get_domains(self):
        return get_domains_by_name(self.client, self.name)


def main():
    client = create_client(auth_token=get_auth_token())
    test_org = Organization(
        client,
        "Communications Security Establishment Canada",
        "CSE",
        "communications-security-establishment-canada",
        "foo",
        "bar",
        "Canada",
        "Ontario",
        "Ottawa",
        True,
        99,
    )
    print(test_org.get_domains())
    print(test_org.get_summary())


if __name__ == "__main__":  # pragma: no cover
    main()
