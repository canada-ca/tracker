from client import get_domains_by_name, create_client, get_auth_token, get_summary_by_name

class Organization:
    # Get list of domains outside and pass in, or fetch list at instantiation?
    def __init__(self, name, acronym, client):
        self.name = name
        self.acronym = acronym
        self.client = client

    def get_summary(self):
        # Temporary, will move actual function here soon
        return get_summary_by_name(self.client, self.name)

    # TODO: make this return a list of domain objects and create another function for JSON output
    def get_domains(self):
        return get_domains_by_name(self.client, self.name)


def main():
    client = create_client(auth_token=get_auth_token())
    test_org = Organization("Communications Security Establishment Canada", "CSE", client)
    print(test_org.get_domains())
    print(test_org.get_summary())


if __name__ == "__main__":  # pragma: no cover
    main()