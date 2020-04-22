import sys
import os
from os.path import dirname, join, expanduser, normpath, realpath
import pytest
from sqlalchemy import create_engine
from manage import *
from db import db_session, Base, engine

class TestDBCreation:
    def test_created_schema_contains_expected_tables(self):
        """This test determines that the postgres db is created with the expected tables"""
        # Arrange
        tables = set()

        # Act
        tables.add("alembic_version")

        for key in Base.metadata.tables.keys():
            tables.add(key)

        # Assert
        assert tables == set(engine.table_names())
