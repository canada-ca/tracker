from re import compile
from graphene.types import Scalar
from graphql.language import ast
from graphql import GraphQLError

from functions.error_messages import *

YEAR_REGEX = r"^\d{4}$"

YEAR_REGEX_CHECK = compile(YEAR_REGEX)


class Year(Scalar):
    """
    A field that conforms to a 4 digit integer
    """

    @staticmethod
    def serialize(value):
        if not isinstance(value, str):
            raise GraphQLError(scalar_error_type("String", value))

        if not YEAR_REGEX_CHECK.search(value):
            raise GraphQLError(scalar_error_type("Year", value))

        return value

    @staticmethod
    def parse_value(value):
        if not isinstance(value, str):
            raise GraphQLError(scalar_error_type("String", value))

        if not YEAR_REGEX_CHECK.search(value):
            raise GraphQLError(scalar_error_type("Year", value))

        return value

    @staticmethod
    def parse_literal(node):
        if not isinstance(node, ast.StringValue):
            raise GraphQLError(
                scalar_error_only_types("strings", "Years", str(type(node)))
            )

        if not YEAR_REGEX_CHECK.search(node.value):
            raise GraphQLError(scalar_error_type("Year", node.value))

        return node.value
