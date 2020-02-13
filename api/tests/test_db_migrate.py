import sys
import os
from os.path import dirname, join, expanduser, normpath, realpath

import pytest

from sqlalchemy import create_engine

# This is the only way I could get imports to work for unit testing.
PACKAGE_PARENT = '..'
SCRIPT_DIR = dirname(realpath(join(os.getcwd(), expanduser(__file__))))
sys.path.append(normpath(join(SCRIPT_DIR, PACKAGE_PARENT)))

from db import *
from manage import app


class TestDBCreation:
    def test_created_schema_contains_expected_tables(self):
        """This test determines that the postgres db is created with the expected tables"""
        # Arrange
        db.init_app(app)
        engine = create_engine(f'postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}')
        tables = set()

        # Act
        tables.add("alembic_version")

        for key in db.metadata.tables.keys():
            tables.add(key)

        # Assert
        assert tables == set(engine.table_names())
