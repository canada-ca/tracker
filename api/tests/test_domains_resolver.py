import sys
import os
from os.path import dirname, join, expanduser, normpath, realpath

import pytest
from graphene.test import Client

from unittest import TestCase

import model_enums
model_enums._called_from_test = True

from app import app
from db import db
from models import Sectors, Groups, Organizations, Domains
from queries import schema


# This is the only way I could get imports to work for unit testing.
PACKAGE_PARENT = '..'
SCRIPT_DIR = dirname(realpath(join(os.getcwd(), expanduser(__file__))))
sys.path.append(normpath(join(SCRIPT_DIR, PACKAGE_PARENT)))


@pytest.fixture(scope='class')
def domain_test_resolver_db_init():
	"""Build database for domain resolver testing"""
	db.init_app(app)

	sectors_added = False
	groups_added = False
	org_added = False
	domain_added = False

	with app.app_context():
		if Sectors.query.first() is None:
			sector = Sectors(
				id=2,
				zone="GC",
				sector="GC_BF",
				description="Banking and Finance"
			)
			db.session.add(sector)
			db.session.commit()
			sectors_added = True

		if Groups.query.first() is None:
			group = Groups(
				id=2,
				s_group='GC_BF',
				description='Banking and Finance',
				sector_id=2
			)
			db.session.add(group)
			db.session.commit()
			groups_added = True

		if Organizations.query.first() is None:
			org = Organizations(
				id=6,
				organization='BOC',
				description='BOC - Bank of Canada',
				group_id=2
			)
			db.session.add(org)
			db.session.commit()
			org_added = True

		if Domains.query.first() is None:
			domain = Domains(
				id=15,
				domain='bankofcanada.ca',
				organization_id=6
			)
			db.session.add(domain)
			db.session.commit()
			domain_added = True

	yield

	with app.app_context():
		if domain_added:
			Domains.query.filter(Domains.id == 15).delete()
			db.session.commit()
		if org_added:
			Organizations.query.filter(Organizations.id == 6).delete()
			db.session.commit()
		if groups_added:
			Groups.query.filter(Groups.id == 2).delete()
			db.session.commit()
		if sectors_added:
			Sectors.query.filter(Sectors.id == 2).delete()
			db.session.commit()


@pytest.mark.usefixtures('domain_test_resolver_db_init')
class TestOrgResolver(TestCase):
	def test_get_domain_resolvers_by_id(self):
		"""Test get_domain_by_id resolver"""
		with app.app_context():
			client = Client(schema)
			query = """
				{
					getDomainById(id: 15){
						domain
					}
				}"""

			result_refr = {
				"data": {
					"getDomainById": [
						{
							"domain": "bankofcanada.ca"
						}
					]
				}
			}

			result_eval = client.execute(query)
		self.assertDictEqual(result_refr, result_eval)

	def test_get_domain_resolvers_by_domain(self):
		""""Test get_domain_by_domain resolver"""
		with app.app_context():
			client = Client(schema)
			query = """
				{
					getDomainByDomain(url: "bankofcanada.ca"){
						domain
					}
				}"""

			result_refr = {
				"data": {
					"getDomainByDomain": [
						{
							"domain": "bankofcanada.ca"
						}
					]
				}
			}

			result_eval = client.execute(query)
		self.assertDictEqual(result_refr, result_eval)

	def test_get_domain_resolvers_by_org(self):
		"""Test get_domain_by_org_enum resolver"""
		with app.app_context():
			client = Client(schema)
			query = """
				{
					getDomainByOrganization(org: BOC){
						domain
					}
				}"""
			result_refr = {
				"data": {
					"getDomainByOrganization": [
						{
							"domain": "bankofcanada.ca"
						}
					]
				}
			}

			result_eval = client.execute(query)
		self.assertDictEqual(result_refr, result_eval)

	def test_domain_resolver_by_id_invalid(self):
		"""Test get_domain_by_id invalid ID error handling"""
		with app.app_context():
			client = Client(schema)
			query = """
				{
					getDomainById(id: 9999){
						domain
					}
				}
			"""
			executed = client.execute(query)

		assert executed['errors']
		assert executed['errors'][0]
		assert executed['errors'][0]['message'] == "Error, Invalid ID"

	def test_domain_resolver_by_org_invalid(self):
		"""Test get_domain_by_domain invalid sector error handling"""
		with app.app_context():
			client = Client(schema)
			query = """
				{
					getDomainByDomain(url: "google.ca"){
						domain
					}
				}
			"""
			executed = client.execute(query)

		assert executed['errors']
		assert executed['errors'][0]
		assert executed['errors'][0]['message'] == 'Error, domain  does not exist'

	def test_domain_resolver_by_org_invalid(self):
		"""Test get_domain_by_org invalid Zone error handling"""
		with app.app_context():
			client = Client(schema)
			query = """
				{
					getDomainByOrganization(org: fds){
						domain
					}
				}
			"""
			executed = client.execute(query)

		assert executed['errors']
		assert executed['errors'][0]
		assert executed['errors'][0]['message'] == f'Argument "org" has invalid value fds.\nExpected type "OrganizationsEnum", found fds.'
