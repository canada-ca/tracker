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

	def test_domain_resolver_by_url_invalid(self):
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
