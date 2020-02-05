import sys
import os

import pytest
from graphene.test import Client
from sqlalchemy import create_engine, Table, MetaData, Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from unittest import TestCase

# This is the only way I could get imports to work for unit testing.
PACKAGE_PARENT = '..'
SCRIPT_DIR = os.path.dirname(os.path.realpath(os.path.join(os.getcwd(), os.path.expanduser(__file__))))
sys.path.append(os.path.normpath(os.path.join(SCRIPT_DIR, PACKAGE_PARENT)))

from app import schema


@pytest.fixture(scope='class')
def build_db_tables():
	"""Build database for group resolver testing"""
	url = "postgresql+psycopg2://postgres:postgres@postgres:5432/auth"

	engine = create_engine(url, echo=True)
	connection = engine.connect()

	meta = MetaData()

	sectors = Table(
		'sectors', meta,
		Column('id', Integer, primary_key=True),
		Column('sector', String),
		Column('zone', String),
		Column('description', String),
	)

	groups = Table(
		'groups', meta,
		Column('id', Integer, primary_key=True),
		Column('s_group', String),
		Column('description', String),
		Column('sector_id', Integer, ForeignKey('sectors.id')),
		relationship('group_sector', "Sectors", back_populates="groups", cascade="all, delete")
	)

	meta.create_all(engine)

	from models import Sectors
	from db import db_session

	if Sectors.query.first() is None:
		sector = Sectors(
			sector="GC",
			zone="GC_A",
			description="Arts"
		)
		db_session.add(sector)
		db_session.commit()

	from models import Groups
	from db import db_session

	if Groups.query.first() is None:
		group = Groups(
			s_group='GC_A',
			description='Arts',
			sector_id=1
		)
		db_session.add(group)
		db_session.commit()

		# This fixture just needs to run to setup a postgres testing instance
		return connection


@pytest.mark.usefixtures('build_db_tables')
class TestGroupResolver(TestCase):
	def test_get_group_by_id(self):
		"""Test get_group_by_id resolver"""
		client = Client(schema)
		query = """
				query{
					getGroupById(id:1) {
						sGroup,
						description
					}
				}"""

		result_refr = {
			"data": {
				"getGroupById": [
					{
						"sGroup": "GC_A",
						"description": "Arts"
					}
				]
			}
		}

		result_eval = client.execute(query)

		self.assertDictEqual(result_refr, result_eval)
