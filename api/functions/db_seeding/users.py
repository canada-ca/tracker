from flask_bcrypt import Bcrypt

from models import Users as User
from app import app


def seed_users(db):
	bcrypt = Bcrypt(app)

	test_user = User(
		username="testuser",
		user_email="testuser@testemail.ca",
		user_password=bcrypt.generate_password_hash(password="testpassword123").decode("UTF-8"),

	)
	db.session.add(test_user)
	db.session.commit()


def remove_users(db):
	User.query.delete()
