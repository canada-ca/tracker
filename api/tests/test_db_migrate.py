import sys
import os
from os.path import dirname, join, expanduser, normpath, realpath

import pytest

# This is the only way I could get imports to work for unit testing.
PACKAGE_PARENT = '..'
SCRIPT_DIR = dirname(realpath(join(os.getcwd(), expanduser(__file__))))
sys.path.append(normpath(join(SCRIPT_DIR, PACKAGE_PARENT)))

from models import Sectors
from db import *
from manage import app


@pytest.fixture(scope='class')
def build_db():

	db.init_app(app)

	sector = Sectors(
		sector='GC_F',
		zone='GC',
		description='Future Government of Canada'
	)
	with app.app_context():
		db.session.add(sector)
		db.session.commit()


@pytest.mark.usefixtures('build_db')
class TestDBCreation:
	def test_db_create(self):

		sector = Sectors(
			sector='GC_F',
			zone='GC',
			description='Future Government of Canada'
		)
		with app.app_context():
			db.session.add(sector)
			db.session.commit()

		with app.app_context():
			ret_sector = Sectors.query.filter(
				Sectors.sector == 'GC_F'
			)

		assert len(ret_sector.all())
