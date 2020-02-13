import sys
import os

import pytest
from graphene.test import Client
from graphql import GraphQLScalarType
from graphql.language import ast
from graphql import GraphQLError

import unittest

# This is the only way I could get imports to work for unit testing.  TODO: See if there is a better way!
PACKAGE_PARENT = '..'
SCRIPT_DIR = os.path.dirname(os.path.realpath(os.path.join(os.getcwd(), os.path.expanduser(__file__))))
sys.path.append(os.path.normpath(os.path.join(SCRIPT_DIR, PACKAGE_PARENT)))

from scalars.url import *


class TestEmailAddressScalar(unittest.TestCase):

	def test_valid_url_serialize(self):
		test_value = 'www.canada.ca'
		assert URL.serialize(test_value)

	def test_valid_url_parse_value(self):
		test_value = 'www.canada.ca'
		assert URL.parse_value(test_value)

	def test_valid_url_parse_literal(self):
		test_value = ast.StringValue(
			value='www.canada.ca'
		)
		assert URL.parse_literal(test_value)

	def test_wrong_ast_type_url_parse_literal(self):
		test_value = ast.IntValue(
			value="1234"
		)
		with self.assertRaisesRegex(GraphQLError, scalar_error_only_types("strings", "URLs", str(ast.Type))):
			URL.parse_literal(test_value)
