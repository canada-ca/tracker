import sys
import os
from graphql.language import ast
from graphql import GraphQLError
import unittest
from scalars.url import URL, scalar_error_type, scalar_error_only_types


class TestEmailAddressScalar(unittest.TestCase):
    def test_valid_url_serialize(self):
        test_email = "test-domain.ca"
        assert URL.serialize(test_email)

    def test_valid_url_parse_value(self):
        test_email = "test-domain.ca"
        assert URL.parse_value(test_email)

    def test_valid_url_parse_literal(self):
        assert URL.parse_literal(ast.StringValue(value="test-domain.ca"))

    def test_invalid_url_serialize_not_url(self):
        test_value = "This Will Fail"
        with self.assertRaisesRegex(GraphQLError, scalar_error_type("URL", test_value)):
            URL.serialize(test_value)

    def test_invalid_url_serialize_wrong_type(self):
        test_value = 1234
        with self.assertRaisesRegex(
            GraphQLError, scalar_error_type("String", test_value)
        ):
            URL.serialize(test_value)

    def test_invalid_url_parse_value_not_url(self):
        test_value = "This Will Fail"
        with self.assertRaisesRegex(GraphQLError, scalar_error_type("URL", test_value)):
            URL.parse_value(test_value)

    def test_invalid_url_parse_value_wrong_type(self):
        test_value = 1234
        with self.assertRaisesRegex(
            GraphQLError, scalar_error_type("String", test_value)
        ):
            URL.parse_value(test_value)

    def test_invalid_url_parse_literal_not_url(self):
        test_value = ast.StringValue(value="This Will Fail")
        with self.assertRaisesRegex(
            GraphQLError, scalar_error_type("URL", test_value.value)
        ):
            URL.parse_literal(test_value)

    def test_invalid_url_parse_literal_wrong_ast_type(self):
        test_value = ast.IntValue(value="1234")
        with self.assertRaisesRegex(
            GraphQLError, scalar_error_only_types("strings", "URLs", str(ast.Type))
        ):
            URL.parse_literal(test_value)
