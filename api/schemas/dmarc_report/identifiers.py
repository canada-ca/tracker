import graphene


class Identifiers(graphene.ObjectType):
    """

    """
    header_from = graphene.String()
    envelope_from = graphene.String()
    envelop_to = graphene.String()
