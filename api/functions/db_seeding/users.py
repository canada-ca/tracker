from flask_bcrypt import Bcrypt

from models import Users


def seed_users(db, app):
    from manage import app
    bcrypt = Bcrypt(app)

    test_user = Users(
        username="testuser",
        user_email="testuser@testemail.ca",
        user_password=bcrypt.generate_password_hash(
            password="testpassword123").decode("UTF-8"),

    )
    with app.app_context():
        db.session.add(test_user)
        db.session.commit()

    test_admin = Users(
        username="testadmin",
        user_email="testadmin@testemail.ca",
        user_password=bcrypt.generate_password_hash(
            password="testpassword123").decode("UTF-8"),
        user_role='admin'
    )
    with app.app_context():
        db.session.add(test_admin)
        db.session.commit()


def remove_users(db, app):
    with app.app_context():
        Users.query.delete()
        db.session.commit()
