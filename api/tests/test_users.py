import pytest
from app import app
from db import db_session
from pytest_bdd import given, when, then
from models import Organizations, Users, User_affiliations
from db import db_session as db


@pytest.fixture
def db():
    with app.app_context():
        yield db
        Users.query.delete()
        db.commit()


def save(thing):
    db.add(thing)
    db.commit()


@when("The database is empty")
@then("Users.find_by_user_name returns None")
def test_find_by_user_name_returns_none(db):
    assert Users.find_by_user_name("bob") is None


@when("a user foo@example.com exists")
@then("Users.find_by_user_name returns that user")
def test_find_by_user_name_returns_a_user(db):
    test_user = Users(user_name="foo@example.com")

    save(test_user)

    retrieved_user = Users.find_by_user_name("foo@example.com")
    assert retrieved_user.user_name == test_user.user_name


@when("saving a user with a bad password")
@then("the model rejects it")
def test_password_validation(db):
    test_user = Users(user_name="foo@example.com", user_password="aaa")

    assert retrieved_user.user_name == test_user.user_name
