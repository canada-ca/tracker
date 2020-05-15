import pytest

from graphql.language import ast
from graphql import GraphQLError

from scalars.organization_acronym import (
    scalar_error_only_types,
    scalar_error_type,
    Acronym,
)


def test_valid_acronym_serialize():
    test_value = "TEST_ORG"
    assert Acronym.serialize(test_value)


def test_invalid_acronym_serialize():
    test_value = "fdsaf"
    with pytest.raises(GraphQLError, match=scalar_error_type("Acronym", test_value)):
        Acronym.serialize(test_value)


def test_invalid_value_acronym_serialize():
    test_value = 3213
    with pytest.raises(GraphQLError, match=scalar_error_type("String", test_value)):
        Acronym.serialize(test_value)


def test_valid_acronym_parse_value():
    test_value = "TEST_ORG"
    assert Acronym.parse_value(test_value)


def test_invalid_acronym_parse_value():
    test_value = "fdasf"
    with pytest.raises(GraphQLError, match=scalar_error_type("Acronym", test_value)):
        Acronym.parse_value(test_value)


def test_invalid_value_acronym_parse_value():
    test_value = 654645
    with pytest.raises(GraphQLError, match=scalar_error_type("String", test_value)):
        Acronym.parse_value(test_value)


def test_valid_acronym_parse_literal():
    test_value = ast.StringValue(value="TEST_ORG")
    assert Acronym.parse_literal(test_value)


def test_invalid_value_acronym_parse_literal():
    test_value = ast.StringValue(value="RandomText")
    with pytest.raises(
        GraphQLError, match=scalar_error_type("Acronym", test_value.value)
    ):
        Acronym.parse_literal(test_value)


def test_wrong_ast_type_url_parse_literal():
    test_value = ast.IntValue(value="1234")
    with pytest.raises(
        GraphQLError, match=scalar_error_only_types("strings", "acronym", str(ast.Type))
    ):
        Acronym.parse_literal(test_value)
