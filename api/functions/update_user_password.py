from graphql import GraphQLError
from flask_bcrypt import Bcrypt
from flask import current_app as app

from functions.input_validators import *
from functions.error_messages import *

from models import Users as User
from db import db_session


def update_password(email, password, confirm_password):
	password = cleanse_input(password)
	confirm_password = cleanse_input(confirm_password)
	email = cleanse_input(email)

	if not is_strong_password(password):
		raise GraphQLError(error_password_does_not_meet_requirements())

	if password != confirm_password:
		raise GraphQLError(error_passwords_do_not_match())

	user = User.query.filter(User.user_email == email).first()

	if user is None:
		raise GraphQLError(error_user_does_not_exist())

	bcrypt = Bcrypt(app)

	user = User.query.filter(User.user_email == email)\
		.update({'user_password': bcrypt.generate_password_hash(password).decode('UTF-8')})

	db_session.commit()

	if not user:
		raise GraphQLError(error_password_not_updated())
	else:
		return user
