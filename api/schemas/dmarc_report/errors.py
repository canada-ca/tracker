import graphene


class Errors(graphene.ObjectType):
    value = graphene.String()

    def resolve_value(self, info):
        print(info)
        pass
