import graphene


class Source(graphene.ObjectType):
    """
    Domain information
    """
    ip_address = graphene.String(
        description=''
    )
    country = graphene.String(
        description=''
    )
    reverse_dns = graphene.String(
        description=''
    )
    base_domain = graphene.String(
        description=''
    )
