import graphene


class Content(graphene.ObjectType):
    """This class handles the inner nested dict given by key: 'content'. """

    body = graphene.String()
    from_email = graphene.String()
    subject = graphene.String()


class Template(graphene.ObjectType):
    """This class handles the inner nested dict given by key: 'template'. """

    id = graphene.String()
    uri = graphene.String()
    version = graphene.Int()


class NotificationEmail(graphene.ObjectType):
    """
    This class contains all of the fields for the entire dict given
    as a response to the Notify client sending it's email
    """

    content = graphene.Field(Content)
    id = graphene.String()
    reference = graphene.String()
    scheduled_for = graphene.String()
    template = graphene.Field(Template)
    uri = graphene.String()
