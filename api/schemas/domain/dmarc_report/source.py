import graphene


class Source(graphene.ObjectType):
    """
    Domain information
    """

    ip_address = graphene.String(description="Source IP Address")
    country = graphene.String(description="Source Country")
    reverse_dns = graphene.String(
        description="Reverse DNS (also known as rDNS) uses PTR records to associate IP addresses with domain names"
    )
    base_domain = graphene.String(description="DMARC base domain")
