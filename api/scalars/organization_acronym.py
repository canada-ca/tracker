from re import compile
from graphene.types import Scalar
from graphql.language import ast
from graphql import GraphQLError

from functions.error_messages import *

ACRONYM_REGEX = r'''^[A-Z0-9_]{1,10}$'''
ACRONYM_REGEX = compile(ACRONYM_REGEX)


class Acronym(Scalar):
    """
    A field whose value is an upper case letter or an under score that has a
    length between 1 and 10
    """
    @staticmethod
    def serialize(value):
        if not isinstance(value, str):
            raise GraphQLError(scalar_error_type("String", value))

        if not ACRONYM_REGEX.search(value):
            raise GraphQLError(scalar_error_type("Acronym", value))
        return value

    @staticmethod
    def parse_value(value):
        if not isinstance(value, str):
            raise GraphQLError(scalar_error_type('String', value))

        if not ACRONYM_REGEX.search(value):
            raise GraphQLError(scalar_error_type("String", value))
        return value

    @staticmethod
    def parse_literal(node):
        if not isinstance(node, ast.StringValue):
            raise GraphQLError(scalar_error_only_types("strings", "acronym", str(ast.Type)))

        if not ACRONYM_REGEX.search(node.value):
            raise GraphQLError(scalar_error_type("Acronym", node.value))
        return node.value
