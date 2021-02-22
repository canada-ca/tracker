from client import get_domain_status, get_dmarc_summary, get_yearly_dmarc_summaries, get_domain_results, create_client, get_auth_token

class Domain:
    def __init__(self, domain_name, client):
        self.domain_name = domain_name
        self.client = client

    def get_status(self):
        return get_domain_status(self.client, self.domain_name)

    def get_dmarc_summary(self, month, year):
        return get_dmarc_summary(self.client, self.domain_name, month, year)

    def get_all_results(self):
        return get_domain_results(self.client, self.domain_name)


def main():
    client = create_client(auth_token=get_auth_token())
    test_domain = Domain("cyber.gc.ca", client)
    print(test_domain.get_status())
    print(test_domain.get_dmarc_summary("september", 2020))
    print(test_domain.get_all_results())



if __name__ == "__main__":  # pragma: no cover
    main()