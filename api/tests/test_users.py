from unittest import TestCase
from app import app
from db import db_session
from models import Organizations, Users, User_affiliations

class TestUsersModel(TestCase):
    # Super Admin Tests
    def test_user(self):

        assert True == True
