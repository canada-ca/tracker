import datetime
from re import compile
from graphene.types import Scalar
from graphql.language import ast
from graphql import GraphQLError

EMAIL_ADDRESS_REGEX = compile('^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$')


class EmailAddress(Scalar):
	'''A field whose value conforms to the standard internet email address format as specified in RFC822: https://www.w3.org/Protocols/rfc822/.'''

	@staticmethod
	def serialize(value):
		if not isinstance(value, str):
			raise GraphQLError("Value is not string: " + str(type(value)))

		if not EMAIL_ADDRESS_REGEX.search(value):
			raise GraphQLError("Value is not a valid email address: " + value)

		return value

	@staticmethod
	def parse_value(value):
		if not isinstance(value, str):
			raise GraphQLError("Value is not string: " + str(type(value)))

		if not EMAIL_ADDRESS_REGEX.search(value):
			raise GraphQLError("Value is not a valid email address: " + value)

		return value

	@staticmethod
	def parse_literal(node):
		if not isinstance(node, ast.StringValue):
			raise GraphQLError("Can only validate strings as email addresses but got a: " + str(ast.Type))

		if not EMAIL_ADDRESS_REGEX.search(node.value):
			raise GraphQLError("Value is not a valid email address: " + node.value)