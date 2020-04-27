import pytest
from app import app
from models import Users
from db import db_session


@pytest.fixture
def save():
    def save(thing):
        db_session.add(thing)
        db_session.commit()

    with app.app_context():
        yield save
        Users.query.delete()


def test_find_by_user_name_returns_none():
    assert Users.find_by_user_name("bob") is None


def test_find_by_user_name_returns_a_user(save):
    test_user = Users(user_name="foo@example.com")

    save(test_user)

    retrieved_user = Users.find_by_user_name("foo@example.com")
    assert retrieved_user.user_name == test_user.user_name


def test_short_passwords_raise_an_error():
    with pytest.raises(ValueError):
        Users(user_name="foo@example.com", password="1")


def test_user_model_encrypts_the_user_password():
    acceptable_password = "twelvechars!"
    user = Users(
        user_name="foo",
        display_name="Foo",
        preferred_lang="English",
        password=acceptable_password,
    )

    assert len(user.password) is 60
