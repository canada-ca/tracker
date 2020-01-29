from graphql import GraphQLError
from flask_bcrypt import Bcrypt
from flask import current_app as app

from functions.input_validators import *
from functions.error_messages import *

from models import Users as User
from db import db_session


def create_user(username, password, confirm_password, email):
	username = cleanse_input(username)
	password = cleanse_input(password)
	confirm_password = cleanse_input(confirm_password)
	email = cleanse_input(email)

	if not is_strong_password(password):
		raise GraphQLError(error_password_does_not_meet_requirements())

	if password != confirm_password:
		raise GraphQLError(error_passwords_do_not_match())

	bcrypt = Bcrypt(app)

	user = User(
		username=username,
		user_email=email,
		preferred_lang='English',
		display_name='Default Display Name',
		user_password=bcrypt.generate_password_hash(password=password).decode('UTF-8')  # Hash the password
	)

	db_session.add(user)
	try:
		db_session.commit()
	except Exception as e:
		db_session.rollback()
		db_session.flush()
		raise GraphQLError(error_creating_account())
