from re import compile
from graphene.types import Scalar
from graphql.language import ast
from graphql import GraphQLError

from functions.error_messages import *

EMAIL_ADDRESS_REGEX = r"""(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[
\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[
a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][
0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[
\x01-\x09\x0b\x0c\x0e-\x7f])+)\])"""

# GC_EMAIL_ADDRESS_REGEX = r"""(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[
# \x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[
# a-z0-9])?\.)+(gc|canada)\.(ca))"""

EMAIL_ADDRESS_REGEX = compile(EMAIL_ADDRESS_REGEX)


class EmailAddress(Scalar):
    """
    A field whose value conforms to the standard internet email address format as specified in RFC822:
    https://www.w3.org/Protocols/rfc822/.
    """

    @staticmethod
    def serialize(value):
        if not isinstance(value, str):
            raise GraphQLError(scalar_error_type("String", value))

        if not EMAIL_ADDRESS_REGEX.search(value):
            raise GraphQLError(scalar_error_type("email address", value))

        return value

    @staticmethod
    def parse_value(value):
        if not isinstance(value, str):
            raise GraphQLError(scalar_error_type("String", value))

        if not EMAIL_ADDRESS_REGEX.search(value):
            raise GraphQLError(scalar_error_type("email address", value))

        return value

    @staticmethod
    def parse_literal(node):
        if not isinstance(node, ast.StringValue):
            raise GraphQLError(
                scalar_error_only_types("strings", "email address", str(type(node)))
            )

        if not EMAIL_ADDRESS_REGEX.search(node.value):
            raise GraphQLError(scalar_error_type("email address", node.value))

        return node.value
