from urllib.parse import urlparse
from re import compile

from graphene.types import Scalar
from graphql.language import ast
from graphql import GraphQLError

# >>> urlparse("https://asdf.com")
# ParseResult(scheme='https', netloc='asdf.com', path='', params='', query='', fragment='')


from functions.error_messages import *

safe_schemes = ["https", "http", "mailto", "ftp"]


class URL(Scalar):
    """
    A field whose value conforms to the standard URL format as specified in RFC3986:
    https://www.ietf.org/rfc/rfc3986.txt.
    """

    # >>> urlparse("https://asdf.com")
    # ParseResult(scheme='https', netloc='asdf.com', path='', params='', query='', fragment='')

    @staticmethod
    def serialize(value):
        if not isinstance(value, str):
            raise GraphQLError(scalar_error_type("String", value))

        parsed = urlparse(value)
        if parsed.username or parsed.password:
            raise GraphQLError(url_contains_credentials("URL", value))
        if parsed.scheme == "":
            raise GraphQLError(url_contains_no_scheme())
        if parsed.scheme not in safe_schemes:
            raise GraphQLError(url_contains_unacceptable_scheme())
        if parsed.netloc == "":
            raise GraphQLError(scalar_error_type("URL", value))

        return value

    @staticmethod
    def parse_value(value):
        if not isinstance(value, str):
            raise GraphQLError(scalar_error_type("String", value))

        parsed = urlparse(value)
        print(parsed)

        if parsed.username or parsed.password:
            raise GraphQLError(url_contains_credentials())
        if parsed.scheme == "":
            raise GraphQLError(url_contains_no_scheme())
        if parsed.scheme not in safe_schemes:
            raise GraphQLError(url_contains_unacceptable_scheme())
        if parsed.netloc == "":
            raise GraphQLError(scalar_error_type("URL", value))

        return value

    @staticmethod
    def parse_literal(node):
        if not isinstance(node, ast.StringValue):
            raise GraphQLError(
                scalar_error_only_types("strings", "URLs", str(type(node)))
            )

        parsed = urlparse(node.value)
        if parsed.username or parsed.password:
            raise GraphQLError(url_contains_credentials())
        if parsed.username or parsed.password:
            raise GraphQLError(url_contains_credentials("URL", node.value))
        if parsed.scheme == "":
            raise GraphQLError(url_contains_no_scheme())
        if parsed.scheme not in safe_schemes:
            raise GraphQLError(url_contains_unacceptable_scheme())
        if parsed.netloc == "":
            raise GraphQLError(scalar_error_type("URL", node.value))

        return node.value
