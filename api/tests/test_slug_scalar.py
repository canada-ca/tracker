import pytest

from graphql.language import ast
from graphql import GraphQLError

from scalars.slug import (
    Slug,
    scalar_error_type,
    scalar_error_only_types,
)


# Test Slug Serializer
def test_valid_slug_serializer():
    test_slug = "this-is-a-valid-slug"
    assert Slug.serialize(test_slug)


def test_invalid_slug_serializer_value():
    invalid_slug = "just some text"
    with pytest.raises(GraphQLError, match=scalar_error_type("Slug", invalid_slug)):
        Slug.serialize(invalid_slug)


def test_invalid_slug_serializer_type():
    invalid_type = 123
    with pytest.raises(GraphQLError, match=scalar_error_type("String", invalid_type)):
        Slug.serialize(invalid_type)


# Test Slug Parse Value
def test_valid_slug_parse_value():
    valid_slug = "this-slug-is-valid"
    assert Slug.parse_value(valid_slug)


def test_invalid_slug_parse_value_value():
    invalid_slug = "this is not a slug"
    with pytest.raises(GraphQLError, match=scalar_error_type("Slug", invalid_slug)):
        Slug.parse_value(invalid_slug)


def test_invalid_slug_parse_value_type():
    invalid_type = 456
    with pytest.raises(GraphQLError, match=scalar_error_type("String", invalid_type)):
        Slug.parse_value(invalid_type)


# Test Slug Parse Literal
def test_valid_slug_parse_literal():
    valid_slug_ast = ast.StringValue(value="some-valid-slug")
    assert Slug.parse_literal(valid_slug_ast)


def test_invalid_slug_parse_literal_value():
    invalid_slug_ast = ast.StringValue(value="this cant be a slug")
    with pytest.raises(
        GraphQLError, match=scalar_error_type("Slug", invalid_slug_ast.value)
    ):
        Slug.parse_literal(invalid_slug_ast)


def test_invalid_slug_parse_literal_type():
    invalid_type_ast = ast.IntValue(value="789")
    with pytest.raises(
        GraphQLError,
        match=scalar_error_only_types("Strings", "Slug", str(type(invalid_type_ast))),
    ):
        Slug.parse_literal(invalid_type_ast)
