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
