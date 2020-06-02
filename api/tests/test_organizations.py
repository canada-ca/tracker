import pytest

from models import Organizations
from db import DB

s, cleanup, _ = DB()


@pytest.fixture
def save():
    yield s
    cleanup()


def test_orgs_make_a_slug_from_the_name():
    org = Organizations(name="Treasury Board Secretariat")
    assert org.slug == "treasury-board-secretariat"
