from re import compile
from graphene.types import Scalar
from graphql.language import ast
from graphql import GraphQLError

from functions.error_messages import *

SLUG_REGEX = r"""^[a-z0-9]+(?:-[a-z0-9]+)*$"""
SLUG_REGEX = compile(SLUG_REGEX)


class Slug(Scalar):
    """
    A field whos values contain numbers, letters, dashes, and underscores
    """

    @staticmethod
    def serialize(value):
        if not isinstance(value, str):
            raise GraphQLError(scalar_error_type("String", value))

        if not SLUG_REGEX.search(value):
            raise GraphQLError(scalar_error_type("Slug", value))
        return value

    @staticmethod
    def parse_value(value):
        if not isinstance(value, str):
            raise GraphQLError(scalar_error_type("String", value))

        if not SLUG_REGEX.search(value):
            raise GraphQLError(scalar_error_type("Slug", value))
        return value

    @staticmethod
    def parse_literal(node):
        if not isinstance(node, ast.StringValue):
            raise GraphQLError(
                scalar_error_only_types("Strings", "Slug", str(ast.Type))
            )

        if not SLUG_REGEX.search(node.value):
            raise GraphQLError(scalar_error_type("Slug", node.value))
        return node.value
