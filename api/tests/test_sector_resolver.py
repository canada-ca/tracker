import sys
import os
from os.path import dirname, join, expanduser, normpath, realpath

import pytest
from graphene.test import Client
from sqlalchemy import create_engine, Table, MetaData, Column, Integer, String

from unittest import TestCase

# This is the only way I could get imports to work for unit testing.
PACKAGE_PARENT = '..'
SCRIPT_DIR = dirname(realpath(join(os.getcwd(), expanduser(__file__))))
sys.path.append(normpath(join(SCRIPT_DIR, PACKAGE_PARENT)))

from app import app, schema
from db import db
from models import Sectors


@pytest.fixture(scope='class')
def sector_test_resolver_db_init():
	db.init_app(app)

	with app.app_context():
		if Sectors.query.first() is None:
			sector = Sectors(
				id=1,
				sector="GC",
				zone="GC_A",
				description="Arts"
			)
			db.session.add(sector)
			db.session.commit()

			sector = Sectors(
				id=2,
				sector="GC_F",
				zone="GC",
				description="Future Government of Canada"
			)
			db.session.add(sector)
			db.session.commit()

			sector = Sectors(
				id=3,
				sector="GC",
				zone="GC_GA",
				description="Government Administration"
			)
			db.session.add(sector)
			db.session.commit()


@pytest.mark.usefixtures('sector_test_resolver_db_init')
class TestSectorResolver(TestCase):
	def test_get_sector_resolver_by_id(self):
		"""Test get_sector_by_id resolver"""
		with app.app_context():
			client = Client(schema)
			query = """
			{
				getSectorById(id: 1) {
					sector
					zone
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

	def test_get_sector_resolver_by_sector(self):
		"""Test get_sector_by_sector resolver"""
		with app.app_context():
			client = Client(schema)
			query = """
			{
				getSectorsBySector(sector: GC_F) {
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

	def test_get_sector_resolver_by_zone(self):
		"""Test get_sector_by_zone resolver"""
		with app.app_context():
			client = Client(schema)
			query = """
				{
					getSectorByZone(zone: GC_GA) {
						sector
						zone
						description
					}
				}"""

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

	def test_sector_resolver_by_id_invalid(self):
		"""Test get_sector_by_id invalid ID error handling"""
		with app.app_context():
			client = Client(schema)
			query = """
			{
				getSectorById(id: 55){
					id
					sector
					zone
					description
				}
			}
			"""
			executed = client.execute(query)

		assert executed['errors']
		assert executed['errors'][0]
		assert executed['errors'][0]['message'] == "Error, Invalid ID"

	def test_sector_resolver_by_sector_invalid(self):
		"""Test get_sector_by_sector invalid sector error handling"""
		with app.app_context():
			client = Client(schema)
			query = """
			{
				getSectorsBySector(sector: str) {
					id
					zone
					description
				}
			}
			"""
			executed = client.execute(query)

		assert executed['errors']
		assert executed['errors'][0]
		assert executed['errors'][0]['message'] == 'Argument "sector" has invalid value str.\nExpected type "sector", found str.'

	def test_sector_resolver_by_zone_invalid(self):
		"""Test get_sector_by_zone invalid Zone error handling"""
		with app.app_context():
			client = Client(schema)
			query = """
			{
				getSectorByZone(zone: str) {
					id
					sector
					zone
					description
				}
			}
			"""
			executed = client.execute(query)

		assert executed['errors']
		assert executed['errors'][0]
		assert executed['errors'][0]['message'] == 'Argument "zone" has invalid value str.\nExpected type "zone", found str.'
