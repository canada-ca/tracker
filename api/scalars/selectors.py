from re import compile
from graphene.types import Scalar
from graphql.language import ast
from graphql import GraphQLError

from functions.error_messages import *

SELECTOR_REGEX = r"\w+\._domainkey"

SELECTOR_REGEX_CHECK = compile(SELECTOR_REGEX)


class Selectors(Scalar):
    """
    A field that conforms to a list of strings
    """

    @staticmethod
    def serialize(value):
        if not isinstance(value, list):
            raise GraphQLError(scalar_error_type("List", value))

        for selector in value:
            if not isinstance(selector, str):
                raise GraphQLError(scalar_error_type("String", selector))
            if not SELECTOR_REGEX_CHECK.search(selector):
                raise GraphQLError(scalar_error_type("Selector", selector))

        return value

    @staticmethod
    def parse_value(value):
        if not isinstance(value, list):
            raise GraphQLError(scalar_error_type("List", value))

        for selector in value:
            if not isinstance(selector, str):
                raise GraphQLError(scalar_error_type("String", selector))
            if not SELECTOR_REGEX_CHECK.search(selector):
                raise GraphQLError(scalar_error_type("Selector", selector))

        return value

    @staticmethod
    def parse_literal(node):
        if not isinstance(node, ast.ListValue):
            raise GraphQLError(
                scalar_error_only_types("lists", "selectors", str(type(node)))
            )
        for selector in node.value:
            if not isinstance(selector, ast.StringValue):
                raise GraphQLError(
                    scalar_error_only_types("strings", "selectors", str(type(selector)))
                )
            if not SELECTOR_REGEX_CHECK.search(selector):
                raise GraphQLError(scalar_error_type("Selector", selector))

        return node.value
