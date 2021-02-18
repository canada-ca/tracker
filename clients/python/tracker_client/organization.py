from client import get_domains_by_name, create_client, get_auth_token, get_summary_by_name

class Organization:
    # Get list of domains outside and pass in, or fetch list at instantiation?
    def __init__(self, name, acronym):
        self.name = name
        self.acronym = acronym

        # Temporary, should be list of Domain objects 
        client = create_client(auth_token=get_auth_token)
        result = get_domains_by_name(client, name)
        self.domains = result[acronym]

    def get_summary(self):
        # Temporary, need to decide if client should be an attribute of this class or be passed in to method call
        client = create_client(auth_token=get_auth_token)
        return get_summary_by_name(client, self.name)

    