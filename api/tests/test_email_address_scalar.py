import sys
import os

import pytest
from graphene.test import Client
from graphql import GraphQLScalarType
from graphql.language import ast
from graphql import GraphQLError

import unittest

# This is the only way I could get imports to work for unit testing.
PACKAGE_PARENT = ".."
SCRIPT_DIR = os.path.dirname(
    os.path.realpath(os.path.join(os.getcwd(), os.path.expanduser(__file__)))
)
sys.path.append(os.path.normpath(os.path.join(SCRIPT_DIR, PACKAGE_PARENT)))

from scalars.email_address import (
    EmailAddress,
    scalar_error_type,
    scalar_error_only_types,
)


class TestEmailAddressScalar(unittest.TestCase):
    def test_valid_email_serialize(self):
        test_email = "test.account@canada.ca"
        assert EmailAddress.serialize(test_email)

    def test_valid_email_parse_value(self):
        test_email = "test.account@canada.ca"
        assert EmailAddress.parse_value(test_email)

    def test_valid_email_parse_literal(self):
        assert EmailAddress.parse_literal(
            ast.StringValue(value="test.account@canada.ca")
        )

    def test_invalid_email_serialize_not_email(self):
        test_value = "This Will Fail"
        with self.assertRaisesRegex(
            GraphQLError, scalar_error_type("email address", test_value)
        ):
            EmailAddress.serialize(test_value)

    def test_invalid_email_serialize_wrong_type(self):
        test_value = 1234
        with self.assertRaisesRegex(
            GraphQLError, scalar_error_type("String", test_value)
        ):
            EmailAddress.serialize(test_value)

    def test_invalid_email_parse_value_not_email(self):
        test_value = "This Will Fail"
        with self.assertRaisesRegex(
            GraphQLError, scalar_error_type("email address", test_value)
        ):
            EmailAddress.parse_value(test_value)

    def test_invalid_email_parse_value_wrong_type(self):
        test_value = 1234
        with self.assertRaisesRegex(
            GraphQLError, scalar_error_type("String", test_value)
        ):
            EmailAddress.parse_value(test_value)

    def test_invalid_email_parse_literal_not_email(self):
        test_value = ast.StringValue(value="This Will Fail")
        with self.assertRaisesRegex(
            GraphQLError, scalar_error_type("email address", test_value.value)
        ):
            EmailAddress.parse_literal(test_value)

    def test_invalid_email_parse_literal_wrong_ast_type(self):
        test_value = ast.IntValue(value="1234")
        with self.assertRaisesRegex(
            GraphQLError,
            scalar_error_only_types("strings", "email address", str(ast.Type)),
        ):
            EmailAddress.parse_literal(test_value)
