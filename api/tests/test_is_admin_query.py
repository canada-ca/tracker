import logging
import pytest

from pytest import fail

from db import DB
from models import Users
from tests.test_functions import run, json


@pytest.fixture
def save():
    save, cleanup, session = DB()
    yield save
    cleanup()


def test_is_admin_query(save, caplog):
    """
    Test to see if query works
    """
    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
    )
    save(user)

    caplog.set_level(logging.INFO)
    result = run(
        query="""
        {
            isUserAdmin{
                isAdmin
            }
        }
        """,
        as_user=user,
    )

    if "errors" in result:
        fail("expected to retrieve true isAdmin. Instead:" "{}".format(json(result)))

    expected_result = {"data": {"isUserAdmin": {"isAdmin": True}}}

    assert result == expected_result
    assert (
        f"User: {user.id} checked for any admin roles, and found at least one."
        in caplog.text
    )
