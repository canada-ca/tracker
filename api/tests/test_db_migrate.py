import sys
import os
from os.path import dirname, join, expanduser, normpath, realpath

import pytest

from sqlalchemy import create_engine

# This is the only way I could get imports to work for unit testing.
PACKAGE_PARENT = '..'
SCRIPT_DIR = dirname(realpath(join(os.getcwd(), expanduser(__file__))))
sys.path.append(normpath(join(SCRIPT_DIR, PACKAGE_PARENT)))

from models import Sectors
from db import *
from manage import app


@pytest.fixture(scope='class')
def initialize_db():

	db.init_app(app)


@pytest.mark.usefixtures('initialize_db')
class TestDBCreation:
	def test_db_create(self):
		tables = set()
		tables.add("alembic_version")

		for key in db.metadata.tables.keys():
			tables.add(key)

		engine = create_engine(f'postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}')
		assert tables == set(engine.table_names())
