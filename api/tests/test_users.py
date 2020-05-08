import pytest
from app import app
from models import Users, User_affiliations, Organizations
from db import DB

s, cleanup, session = DB()


@pytest.fixture
def save():
    with app.app_context():
        yield s
        cleanup()


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


def test_user_is_admin_on_their_default_org():
    acceptable_password = "twelvechars!"
    user = Users(
        user_name="foo",
        display_name="Foo",
        preferred_lang="English",
        password=acceptable_password,
    )

    for affiliation in user.user_affiliation:
        assert affiliation.permission is "admin"
        assert affiliation.user_organization.acronym == "FOO"


def test_users_roles_can_be_accessed_by_a_roles_method(save):
    acceptable_password = "twelvechars!"
    user = Users(
        user_name="foo",
        display_name="Foo",
        preferred_lang="English",
        password=acceptable_password,
    )

    user.user_affiliation.append(
        User_affiliations(
            permission="user_write",
            user_organization=Organizations(
                acronym="ORG1", org_tags={"description": "Organization 1"}
            ),
        )
    )

    # Before save org_id and user_id are None
    role = [r for r in user.roles if r["permission"] == "user_write"]
    assert role == [{"org_id": None, "permission": "user_write", "user_id": None}]
