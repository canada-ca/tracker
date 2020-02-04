import sys
import os
from os.path import dirname, join, expanduser, normpath, realpath

import pytest

import unittest

# This is the only way I could get imports to work for unit testing.
PACKAGE_PARENT = '..'
SCRIPT_DIR = dirname(realpath(join(os.getcwd(), expanduser(__file__))))
sys.path.append(normpath(join(SCRIPT_DIR, PACKAGE_PARENT)))

from models import Sectors
from app import app, db


@pytest.fixture(scope='class')
def build_db():
	with app.app_context():
		from flask_migrate import init as _init
		from flask_migrate import migrate as _migrate
		from flask_migrate import upgrade as _upgrade
	_init()
	_migrate()
	_upgrade()


@pytest.mark.usefixtures('build_db')
class TestDBCreation:
	def test_db_create(self):
		from db import db

		sector = Sectors(
			sector='GC_F',
			zone='GC',
			description='Future Government of Canada'
		)
		db.session.add(sector)
		db.session.commit()

		ret_sector = Sectors.query().filter(
			sector='GC_F'
		).first()

		assert sector.zone == ret_sector.zone
