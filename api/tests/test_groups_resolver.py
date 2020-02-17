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
from models import Sectors, Groups
from queries import schema

# This is the only way I could get imports to work for unit testing.
PACKAGE_PARENT = '..'
SCRIPT_DIR = dirname(realpath(join(os.getcwd(), expanduser(__file__))))
sys.path.append(normpath(join(SCRIPT_DIR, PACKAGE_PARENT)))


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

	def test_group_resolver_by_id_invalid(self):
		"""Test get_group_by_id invalid ID error handling"""
		with app.app_context():
			client = Client(schema)
			query = """
				{
					getGroupById(id: 9999){
						id
						description
						sectorId
					}
				}
			"""
			executed = client.execute(query)

		assert executed['errors']
		assert executed['errors'][0]
		assert executed['errors'][0]['message'] == "Error, Invalid ID"

	def test_group_resolver_by_group_invalid(self):
		"""Test get_group_by_group invalid sector error handling"""
		with app.app_context():
			client = Client(schema)
			query = """
				{
					getGroupByGroup(group: fds){
						id
						description
						sectorId
					}
				}
			"""
			executed = client.execute(query)

		assert executed['errors']
		assert executed['errors'][0]
		assert executed['errors'][0]['message'] == f'Argument "group" has invalid value fds.\nExpected type "GroupEnums", found fds.'

	def test_group_resolver_by_sector_invalid(self):
		"""Test get_group_by_sector invalid Zone error handling"""
		with app.app_context():
			client = Client(schema)
			query = """
				{
					getGroupBySector(sector: dsa){
						id
						description
						sectorId
					}
				}
			"""
			executed = client.execute(query)

		assert executed['errors']
		assert executed['errors'][0]
		assert executed['errors'][0]['message'] == f'Argument "sector" has invalid value dsa.\nExpected type "SectorEnums", found dsa.'