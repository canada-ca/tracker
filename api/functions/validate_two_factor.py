import os

from graphql import GraphQLError

from models import Users as User

from functions.error_messages import *

from db import db

import pyotp


def validate_two_factor(email, otp_code):
	"""This function validates that the otp given for a specific user is valid, and if it is,
	authenticates that user's 2FA column in postgres.

	:param email - Email address of the user who is going to be validated for 2FA
	:param otp_code - The one time password (otp) that they are attempting to verify

	:returns User object if queried successfully, null if not
	"""

	valid_code = pyotp.totp.TOTP(os.getenv('BASE32_SECRET')).verify(otp_code)  # todo: Update to use an env variable.

	user = User.query.filter(User.user_email == email).first()

	if user is None:
		raise GraphQLError(error_user_does_not_exist())

	if valid_code:
		user = User.query.filter(User.user_email == email) \
			.update({'two_factor_auth': True})

		db.session.commit()

		user = User.query.filter(User.user_email == email).first()

		if not user:
			raise GraphQLError(error_user_not_updated())
		else:
			print(user)
			return user

	else:
		raise GraphQLError(error_otp_code_is_invalid())
