import graphene


class Identifiers(graphene.ObjectType):
    """

    """
    header_from = graphene.String(
        description=''
    )
    envelope_from = graphene.String(
        description=''
    )
    envelope_to = graphene.String(
        description=''
    )
