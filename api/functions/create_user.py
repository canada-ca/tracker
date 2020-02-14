from graphql import GraphQLError
from flask_bcrypt import Bcrypt
from flask import current_app as app

from functions.input_validators import *
from functions.error_messages import *

from models import Users as User
from db import db


def create_user(username, password, confirm_password, email):
	"""
	This function creates and inserts a new user into the database. It includes appropriate error checking to ensure
	that the API is managed properly.
	:param username: The username for the new user.
	:param password: The password for the new user.
	:param confirm_password: Password confirmation for the new user -- Must be identical to password.
	:param email: The email address to be associated with the new user -- Must be unique for every user.
	:return user: User is the newly inserted User Object that was pushed into the DB
	"""
	username = cleanse_input(username)
	password = cleanse_input(password)
	confirm_password = cleanse_input(confirm_password)
	email = cleanse_input(email)

	if not is_strong_password(password):
		raise GraphQLError(error_password_does_not_meet_requirements())

	if password != confirm_password:
		raise GraphQLError(error_passwords_do_not_match())

	bcrypt = Bcrypt(app)  # Create the bcrypt object that handles password hashing and verifying.

	user = User.query.filter(User.user_email == email).first()

	if user is None:
		user = User(
			username=username,
			user_email=email,
			preferred_lang='English',
			display_name='Default Display Name',
			user_password=bcrypt.generate_password_hash(password=password).decode('UTF-8')  # Hash the password
		)

		db.session.add(user)
		try:
			db.session.commit()
			return user
		except Exception as e:
			db.session.rollback()
			db.session.flush()
			raise GraphQLError(error_creating_account())
	else:
		# Ensure that users have unique email addresses
		raise GraphQLError(error_email_in_use())
