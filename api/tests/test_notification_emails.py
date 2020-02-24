import sys
import os
from os.path import dirname, join, expanduser, normpath, realpath

import pytest
from graphene.test import Client

from unittest import TestCase

from functions.error_messages import scalar_error_type

from manage import seed, remove_seed

seed()
from db import db
from app import app
from models import Sectors
from queries import schema
remove_seed()

# This is the only way I could get imports to work for unit testing.
PACKAGE_PARENT = '..'
SCRIPT_DIR = dirname(realpath(join(os.getcwd(), expanduser(__file__))))
sys.path.append(normpath(join(SCRIPT_DIR, PACKAGE_PARENT)))


class TestErrorHandling:
    def test_invalid_email(self):
        client = Client(schema)
        executed = client.execute(
            '''
            {
                sendPasswordReset(email: "invalid-email.ca")
            }
            ''')
        assert executed['errors']
        assert executed['errors'][0]
        assert executed['errors'][0]['message'] == scalar_error_type("email address", "invalid-email.ca")
