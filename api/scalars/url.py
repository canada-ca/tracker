from graphene.types import Scalar
from graphql.language import ast
from graphql import GraphQLError

from functions.error_messages import *


class URL(Scalar):
	'''A field whose value conforms to the standard URL format as specified in RFC3986:
	https://www.ietf.org/rfc/rfc3986.txt.'''

	@staticmethod
	def serialize(value):
		return str(value)

	@staticmethod
	def parse_value(value):
		return str(value)

	@staticmethod
	def parse_literal(node):
		if not isinstance(node, ast.StringValue):
			raise GraphQLError(scalar_error_only_types("strings", "URLs", str(ast.Type)))

		return str(node.value)
