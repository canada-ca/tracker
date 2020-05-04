import graphene


class Identifiers(graphene.ObjectType):
    """
    Identifiers identify a domain name to be authenticated
    """

    header_from = graphene.String(
        description="the domain DMARC uses to check alignment with SPF/DKIM"
    )
    envelope_from = graphene.String(description="SPF domain used to check alignment")
    envelope_to = graphene.String(
        description='"Envelope Recipient" in the email header'
    )
