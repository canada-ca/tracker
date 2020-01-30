from graphql import GraphQLError
from flask_bcrypt import Bcrypt
from flask import current_app as app
from flask_graphql_auth import create_access_token

from functions.input_validators import *
from functions.error_messages import *

from models import Users as User
from db import db_session


def sign_in_user(email, password):
	email = cleanse_input(email)
	password = cleanse_input(password)
	user = User.query.filter(User.user_email == email).first()

	if user is None:
		raise GraphQLError(error_user_does_not_exist())

	bcrypt = Bcrypt(app)

	email_match = email == user.user_email
	password_match = bcrypt.check_password_hash(user.user_password, password)

	if email_match and password_match:
		temp_dict = {
			'auth_token': create_access_token(user.id),
			'user': user
		}

		return temp_dict
	else:
		raise GraphQLError(error_invalid_credentials())
