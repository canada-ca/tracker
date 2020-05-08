from re import compile
from graphene.types import Scalar
from graphql.language import ast
from graphql import GraphQLError

from functions.error_messages import *

URL_REGEX = r"[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)"

URL_REGEX_CHECK = compile(URL_REGEX)


class URL(Scalar):
    """
    A field whose value conforms to the standard URL format as specified in RFC3986:
    https://www.ietf.org/rfc/rfc3986.txt.
    """

    @staticmethod
    def serialize(value):
        if not isinstance(value, str):
            raise GraphQLError(scalar_error_type("String", value))

        if not URL_REGEX_CHECK.search(value):
            raise GraphQLError(scalar_error_type("URL", value))

        return value

    @staticmethod
    def parse_value(value):
        if not isinstance(value, str):
            raise GraphQLError(scalar_error_type("String", value))

        if not URL_REGEX_CHECK.search(value):
            raise GraphQLError(scalar_error_type("URL", value))

        return value

    @staticmethod
    def parse_literal(node):
        if not isinstance(node, ast.StringValue):
            raise GraphQLError(
                scalar_error_only_types("strings", "URLs", str(type(node)))
            )

        if not URL_REGEX_CHECK.search(node.value):
            raise GraphQLError(scalar_error_type("URL", node.value))

        return node.value
