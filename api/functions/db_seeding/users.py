from flask_bcrypt import Bcrypt

from models import Users


def seed_users(db):
	from manage import app
	bcrypt = Bcrypt(app)

	test_user = Users(
		username="testuser",
		user_email="testuser@testemail.ca",
		user_password=bcrypt.generate_password_hash(password="testpassword123").decode("UTF-8"),

	)
	db.session.add(test_user)
	db.session.commit()


def remove_users(db):
	Users.query.filter(Users.user_email == "testuser@testemail.ca").delete()
	db.session.commit()
