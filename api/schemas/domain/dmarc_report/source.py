import graphene


class Source(graphene.ObjectType):
    """
    Domain information
    """
    ip_address = graphene.String()
    country = graphene.String()
    reverse_dns = graphene.String()
    base_domain = graphene.String()
