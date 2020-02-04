import sys
import os
from os.path import dirname, join, expanduser, normpath, realpath

import pytest

import unittest

# This is the only way I could get imports to work for unit testing.
PACKAGE_PARENT = '..'
SCRIPT_DIR = dirname(realpath(join(os.getcwd(), expanduser(__file__))))
sys.path.append(normpath(join(SCRIPT_DIR, PACKAGE_PARENT)))

from db_manager.manage import app, create_db

from models import Sectors


@pytest.fixture(scope='class')
def create_database():
	create_db()


@pytest.mark.usefixtures('create_database')
class TestDBCreation:
	def test_db_create(self):
		from db import db_session

		sector = Sectors(
			sector='GC_F',
			zone='GC',
			description='Future Government of Canada'
		)
		db_session.add(sector)
		db_session.commit()

		ret_sector = Sectors.query().filter(
			sector='GC_F'
		).first()

		assert sector.zone == ret_sector.zone
