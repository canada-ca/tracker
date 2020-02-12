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

from app import app, schema
from models import Groups, Sectors
from db import db


@pytest.fixture(scope='class')
def group_test_resolver_db_init():
	"""Build database for group resolver testing"""
	db.init_app(app)

	with app.app_context():
		if Sectors.query.first() is None:
			sector = Sectors(
				id=1,
				zone="GC",
				sector="GC_A",
				description="Arts"
			)
			db.session.add(sector)
			db.session.commit()

		if Groups.query.first() is None:
			group = Groups(
				id=1,
				s_group='GC_A',
				description='Arts',
				sector_id=1
			)
			db.session.add(group)
			db.session.commit()

	yield

	with app.app_context():
		Groups.query.filter(Groups.id == 1).delete()
		db.session.commit()
		Sectors.query.filter(Sectors.id == 1).delete()
		db.session.commit()


@pytest.mark.usefixtures('group_test_resolver_db_init')
class TestGroupResolver(TestCase):
	def test_get_group_resolvers_by_id(self):
		"""Test get_group_by_id resolver"""
		with app.app_context():
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

	def test_get_group_resolvers_by_group(self):
		""""Test get_group_by_group resolver"""
		with app.app_context():
			client = Client(schema)
			query = """
					{
						getGroupByGroup(group: GC_A){
							description
							sectorId
						}
					}"""

			result_refr = {
				"data": {
					"getGroupByGroup": [
						{
							"description": "Arts",
							"sectorId": 1
						}
					]
				}
			}

			result_eval = client.execute(query)
		self.assertDictEqual(result_refr, result_eval)

	def test_get_group_resolvers_by_sector(self):
		"""Test get_group_by_sector_id resolver"""
		with app.app_context():
			client = Client(schema)
			query = """
					{
						getGroupBySector(sector: GC_A){
							description
							groupSector{
								id
								zone
								description
							}
						}
					}"""
			result_refr = {
				"data": {
					"getGroupBySector": [
						{
							"description": "Arts",
							"groupSector": {
								"id": "U2VjdG9yczox",
								"zone": "GC",
								"description": "Arts"
							}
						}
					]
				}
			}

			result_eval = client.execute(query)
		self.assertDictEqual(result_refr, result_eval)
