import pytest

from graphql.language import ast
from graphql import GraphQLError

from scalars.email_address import (
    EmailAddress,
    scalar_error_type,
    scalar_error_only_types,
)


def test_valid_email_serialize():
    test_email = "test.account@canada.ca"
    assert EmailAddress.serialize(test_email)


def test_valid_email_parse_value():
    test_email = "test.account@canada.ca"
    assert EmailAddress.parse_value(test_email)


def test_valid_email_parse_literal():
    assert EmailAddress.parse_literal(ast.StringValue(value="test.account@canada.ca"))


def test_invalid_email_serialize_not_email():
    test_value = "This Will Fail"
    with pytest.raises(
        GraphQLError, match=scalar_error_type("email address", test_value)
    ):
        EmailAddress.serialize(test_value)


def test_invalid_email_serialize_wrong_type():
    test_value = 1234
    with pytest.raises(GraphQLError, match=scalar_error_type("String", test_value)):
        EmailAddress.serialize(test_value)


def test_invalid_email_parse_value_not_email():
    test_value = "This Will Fail"
    with pytest.raises(
        GraphQLError, match=scalar_error_type("email address", test_value)
    ):
        EmailAddress.parse_value(test_value)


def test_invalid_email_parse_value_wrong_type():
    test_value = 1234
    with pytest.raises(GraphQLError, match=scalar_error_type("String", test_value)):
        EmailAddress.parse_value(test_value)


def test_invalid_email_parse_literal_not_email():
    test_value = ast.StringValue(value="This Will Fail")
    with pytest.raises(
        GraphQLError, match=scalar_error_type("email address", test_value.value)
    ):
        EmailAddress.parse_literal(test_value)


def test_invalid_email_parse_literal_wrong_ast_type():
    test_value = ast.IntValue(value="1234")
    with pytest.raises(
        GraphQLError,
        match=scalar_error_only_types("strings", "email address", str(ast.Type)),
    ):
        EmailAddress.parse_literal(test_value)
