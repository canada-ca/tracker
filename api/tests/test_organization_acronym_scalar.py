import sys
import os
from graphql.language import ast
from graphql import GraphQLError
from unittest import TestCase
from scalars.organization_acronym import (
    scalar_error_only_types,
    scalar_error_type,
    Acronym
)


class TestOrganizationScalar(TestCase):

    def test_valid_acronym_serialize(self):
        test_value = 'TEST_ORG'
        assert Acronym.serialize(test_value)

    def test_invalid_acronym_serialize(self):
        test_value = 'fdsaf'
        with self.assertRaisesRegex(
            GraphQLError,
            scalar_error_type("Acronym", test_value)
        ):
            Acronym.serialize(test_value)

    def test_invalid_value_acronym_serialize(self):
        test_value = 3213
        with self.assertRaisesRegex(
            GraphQLError,
            scalar_error_type("String", test_value)
        ):
            Acronym.serialize(test_value)

    def test_valid_acronym_parse_value(self):
        test_value = 'TEST_ORG'
        assert Acronym.parse_value(test_value)

    def test_invalid_acronym_parse_value(self):
        test_value = 'fdasf'
        with self.assertRaisesRegex(
            GraphQLError,
            scalar_error_type("Acronym", test_value)
        ):
            Acronym.parse_value(test_value)

    def test_invalid_value_acronym_parse_value(self):
        test_value = 654645
        with self.assertRaisesRegex(
            GraphQLError,
            scalar_error_type("String", test_value)
        ):
            Acronym.parse_value(test_value)

    def test_valid_acronym_parse_literal(self):
        test_value = ast.StringValue(
            value='TEST_ORG'
        )
        assert Acronym.parse_literal(test_value)

    def test_invalid_value_acronym_parse_literal(self):
        test_value = ast.StringValue(
            value='RandomText'
        )
        with self.assertRaisesRegex(
            GraphQLError,
            scalar_error_type("Acronym", test_value.value)
        ):
            Acronym.parse_literal(test_value)

    def test_wrong_ast_type_url_parse_literal(self):
        test_value = ast.IntValue(
            value="1234"
        )
        with self.assertRaisesRegex(
            GraphQLError,
            scalar_error_only_types("strings", "acronym", str(ast.Type))
        ):
            Acronym.parse_literal(test_value)
