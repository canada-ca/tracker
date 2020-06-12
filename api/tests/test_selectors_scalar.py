import pytest
from graphql.language import ast
from graphql import GraphQLError
from scalars.selectors import Selectors, scalar_error_type, scalar_error_only_types


def test_valid_selectors_serialize_list():
    test_selectors = ["selector1._domainkey", "selector2._domainkey"]
    assert Selectors.serialize(test_selectors)


def test_valid_selectors_parse_value_list():
    test_selectors = ["selector1._domainkey", "selector2._domainkey"]
    assert Selectors.parse_value(test_selectors)


def test_valid_selectors_serialize_not_list():
    test_selectors = "selector1._domainkey"
    assert Selectors.serialize(test_selectors)


def test_valid_selectors_parse_value_not_list():
    test_selectors = "selector1._domainkey"
    assert Selectors.parse_value(test_selectors)


def test_valid_selectors_parse_literal():
    assert Selectors.parse_literal(
        ast.ListValue(
            value=[
                ast.StringValue(value="selector1._domainkey"),
                ast.StringValue(value="selector2._domainkey"),
            ]
        )
    )


def test_invalid_selectors_serialize_not_selector():
    test_list = ["This Will Fail"]
    with pytest.raises(GraphQLError, match=scalar_error_type("Selectors", test_list)):
        Selectors.serialize(test_list)


def test_invalid_selectors_serialize_wrong_type():
    test_list = [1234]
    with pytest.raises(GraphQLError, match=scalar_error_type("String", test_list)):
        Selectors.serialize(test_list)


def test_invalid_selectors_parse_value_not_selector():
    test_list = ["This Will Fail"]
    with pytest.raises(GraphQLError, match=scalar_error_type("Selectors", test_list)):
        Selectors.parse_value(test_list)


def test_invalid_selectors_parse_value_wrong_type():
    test_list = [1234]
    with pytest.raises(GraphQLError, match=scalar_error_type("String", test_list)):
        Selectors.parse_value(test_list)


def test_invalid_selectors_parse_literal_not_selector():
    test_list = ast.ListValue(value=[ast.StringValue(value="This Will Fail")])
    with pytest.raises(
        GraphQLError, match=scalar_error_type("Selectors", test_list.value)
    ):
        Selectors.parse_literal(test_list)


def test_invalid_selectors_parse_literal_wrong_ast_type():
    test_list = ast.ListValue(value=[ast.IntValue(value=1234)])
    with pytest.raises(
        GraphQLError,
        match=scalar_error_only_types("strings", "selectors", str(ast.Type)),
    ):
        Selectors.parse_literal(test_list)
