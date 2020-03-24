import graphene


class Source(graphene.ObjectType):
    """

    """
    ip_address = graphene.String()
    country = graphene.String()
    reverse_dns = graphene.String()
    base_domain = graphene.String()
