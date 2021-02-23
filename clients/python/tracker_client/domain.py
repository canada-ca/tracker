from core import create_client, get_auth_token
from results import get_all_results, get_domain_status, get_email_results, get_web_results
from dmarc import get_dmarc_summary, get_yearly_dmarc_summaries

class Domain:
    def __init__(self, domain_name, client):
        self.domain_name = domain_name
        self.client = client

    def get_status(self):
        return get_domain_status(self.client, self.domain_name)

    def get_monthly_dmarc(self, month, year):
        return get_dmarc_summary(self.client, self.domain_name, month, year)

    def get_yearly_dmarc(self):
        return get_yearly_dmarc_summaries(self.client, self.domain_name)

    def get_all_results(self):
        return get_all_results(self.client, self.domain_name)

    def get_web_results(self):
        return get_web_results(self.client, self.domain_name)

    def get_email_results(self):
        return get_email_results(self.client, self.domain_name)


def main():
    client = create_client(auth_token=get_auth_token())
    test_domain = Domain("cyber.gc.ca", client)
    print(test_domain.get_status())
    print(test_domain.get_monthly_dmarc("september", 2020))
    print(test_domain.get_yearly_dmarc())
    print(test_domain.get_all_results())
    print(test_domain.get_web_results())
    print(test_domain.get_email_results())


if __name__ == "__main__":  # pragma: no cover
    main()