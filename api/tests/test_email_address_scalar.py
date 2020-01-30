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

from scalars.email_address import *


class TestEmailAddressScalar(unittest.TestCase):

	def testValidEmailSerialize(self):
		test_email = 'test.account@canada.ca'
		assert EmailAddress.serialize(test_email)

	def testValidEmailParseValue(self):
		test_email = "test.account@canada.ca"
		assert EmailAddress.parse_value(test_email)

	def testValidEmailParseLiteral(self):
		assert EmailAddress.parse_literal(ast.StringValue(
			value="test.account@canada.ca"
		))

	def testInvalidEmailSerialize(self):
		test_email = 'This Will Fail'
		self.assertRaises(GraphQLError, EmailAddress.serialize(test_email), scalar_error_type("email address", test_email))
