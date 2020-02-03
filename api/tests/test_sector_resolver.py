import sys
import os

import pytest
from graphene.test import Client
from sqlalchemy import create_engine, Table, MetaData, Column, Integer, String

from unittest import TestCase

# This is the only way I could get imports to work for unit testing.
PACKAGE_PARENT = '..'
SCRIPT_DIR = os.path.dirname(os.path.realpath(os.path.join(os.getcwd(), os.path.expanduser(__file__))))
sys.path.append(os.path.normpath(os.path.join(SCRIPT_DIR, PACKAGE_PARENT)))

from app import schema


@pytest.fixture(scope='class')
def build_sectors_table():
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

		sector = Sectors(
			sector="GC_F",
			zone="GC",
			description="Future Government of Canada"
		)

		db_session.add(sector)
		db_session.commit()

		sector = Sectors(
			sector="GC",
			zone="GC_GA",
			description="Government Administration"
		)

		db_session.add(sector)
		db_session.commit()

		# This fixture just needs to run to setup a postgres testing instance
		return connection


@pytest.mark.usefixtures('build_sectors_table')
class TestSectorResolver(TestCase):
	def test_get_sector_by_id(self):
		client = Client(schema)
		query = """
			query{
				getSectorById(id: 1) {
					sector,
					zone,
					description
				}
			}
			"""

		result_refr = {
			"data": {
				"getSectorById": [
					{
						"sector": "GC",
						"zone": "GC_A",
						"description": "Arts"
					}
				]
			}
		}

		result_eval = client.execute(query)

		self.assertDictEqual(result_refr, result_eval)

	def test_get_sector_by_sector(self):
		client = Client(schema)
		query = """
			query{
				getSectorsBySector(sector: "GC_F") {
					zone
					description
				}
			}
			"""

		result_refr = {
			"data": {
				"getSectorsBySector": [
					{
						"zone": "GC",
						"description": "Future Government of Canada"
					}
				]
			}
		}

		result_eval = client.execute(query)

		self.assertDictEqual(result_refr, result_eval)

	def test_get_sector_by_zone(self):
		client = Client(schema)
		query = """
			query{
				getSectorByZone(zone: "GC_GA"){
					sector,
					zone,
					description
				}
			}
			"""

		result_refr = {
			"data": {
				"getSectorByZone": [
					{
						"sector": "GC",
						"zone": "GC_GA",
						"description": "Government Administration"
					}
				]
			}
		}

		result_eval = client.execute(query)

		self.assertDictEqual(result_refr, result_eval)

	def test_sector_by_id_invalid(self):
		client = Client(schema)
		query = """
			query{
				getSectorById(id: 55){
					id,
					sector,
					zone,
					description
				}
			}
			"""
		executed = client.execute(query)
		assert executed['errors']
		assert executed['errors'][0]
		assert executed['errors'][0]['message'] == "Error, Invalid ID"

	def test_sector_by_zone_invalid(self):
		client = Client(schema)
		query = """
			query{
				getSectorByZone(zone: "fdsfa"){
					id,
					sector,
					zone,
					description
				}
			}
			"""
		executed = client.execute(query)
		assert executed['errors']
		assert executed['errors'][0]
		assert executed['errors'][0]['message'] == "Error, Zone does not exist"

	def test_sector_by_sector_invalid(self):
		client = Client(schema)
		query = """
		query{
			getSectorsBySector(sector: "Should Not Work") {
				id
				zone
				description
			}
		}
		"""
		executed = client.execute(query)
		assert executed['errors']
		assert executed['errors'][0]
		assert executed['errors'][0]['message'] == "Error, Sector does not exist"
