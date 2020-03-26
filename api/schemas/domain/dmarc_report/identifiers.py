import graphene


class Identifiers(graphene.ObjectType):
    """

    """
    header_from = graphene.String()
    envelope_from = graphene.String()
    envelope_to = graphene.String()
