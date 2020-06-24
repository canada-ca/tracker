import pytest
from graphql.language import ast
from graphql import GraphQLError
from scalars.url import (
    URL,
    scalar_error_type,
    scalar_error_only_types,
    url_contains_credentials,
    url_contains_no_scheme,
    url_contains_unacceptable_scheme,
)


def test_username_and_passwords_are_rejected_in_values():
    url = "https://user:password@example.com/path?key=value#hash"
    with pytest.raises(GraphQLError, match=url_contains_credentials()):
        assert URL.parse_value(url)


def test_file_schemes_are_rejected_in_values():
    url = "file:///foo.txt"
    with pytest.raises(GraphQLError, match=url_contains_unacceptable_scheme()):
        assert URL.parse_value(url)


def test_file_schemes_are_rejected_in_literals():
    url = "file:///foo.txt"
    with pytest.raises(GraphQLError, match=url_contains_unacceptable_scheme()):
        assert URL.parse_literal(ast.StringValue(value=url))


def test_username_and_passwords_are_rejected_in_literals():
    url = "https://user:password@example.com/path?key=value#hash"
    with pytest.raises(GraphQLError, match=url_contains_credentials()):
        assert URL.parse_literal(ast.StringValue(value=url))


def test_valid_url_serialize():
    url = "https://example.com"
    assert URL.serialize(url)


def test_valid_url_parse_value():
    url = "https://example.com"
    assert URL.parse_value(url)


def test_valid_url_parse_literal():
    assert URL.parse_literal(ast.StringValue(value="https://example.com"))


def test_invalid_url_serialize_not_url():
    test_value = "This Will Fail"
    with pytest.raises(GraphQLError, match=url_contains_no_scheme()):
        URL.serialize(test_value)


def test_invalid_url_serialize_wrong_type():
    test_value = 1234
    with pytest.raises(GraphQLError, match=scalar_error_type("String", test_value)):
        URL.serialize(test_value)


def test_invalid_url_parse_value_not_url():
    test_value = "This Will Fail"
    with pytest.raises(GraphQLError, match=url_contains_no_scheme()):
        URL.parse_value(test_value)


def test_invalid_url_parse_value_wrong_type():
    test_value = 1234
    with pytest.raises(GraphQLError, match=scalar_error_type("String", test_value)):
        URL.parse_value(test_value)


def test_invalid_url_parse_literal_not_url():
    test_value = ast.StringValue(value="This Will Fail")
    with pytest.raises(GraphQLError, match=url_contains_no_scheme()):
        URL.parse_literal(test_value)


def test_invalid_url_parse_literal_wrong_ast_type():
    test_value = ast.IntValue(value="1234")
    with pytest.raises(
        GraphQLError, match=scalar_error_only_types("strings", "URLs", str(ast.Type))
    ):
        URL.parse_literal(test_value)
