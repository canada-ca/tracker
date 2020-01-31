import sys
import os

import pytest
from graphene.test import Client
from graphql import GraphQLScalarType
from graphql.language import ast
from graphql import GraphQLError

import unittest

# This is the only way I could get imports to work for unit testing.
PACKAGE_PARENT = '..'
SCRIPT_DIR = os.path.dirname(os.path.realpath(os.path.join(os.getcwd(), os.path.expanduser(__file__))))
sys.path.append(os.path.normpath(os.path.join(SCRIPT_DIR, PACKAGE_PARENT)))

from resolvers.sectors import *
from app import schema


# class TestSectorResolver(unittest.TestCase):
# 	def test_get_sector_by_id(self):
# 		client = Client(schema)
# 		query = """
# 			query{
# 				getSectorById(id: 1) {
# 					sector,
# 					zone,
# 					description
# 				}
# 			}
# 			"""
#
# 		result_refr = {
# 			"data": {
# 				"getSectorById": [
# 					{
# 						"sector": "GC",
# 						"zone": "GC_A",
# 						"description": "Arts"
# 					}
# 				]
# 			}
# 		}
#
# 		result_eval = client.execute(query)
#
# 		self.assertDictEqual(result_refr, result_eval)
#
# 	def test_get_sector_by_sector(self):
# 		client = Client(schema)
# 		query = """
# 			query{
# 				getSectorsBySector(sector: "GC_F") {
# 					zone
# 					description
# 				}
# 			}
# 			"""
#
# 		result_refr = {
# 			"data": {
# 				"getSectorsBySector": [
# 					{
# 						"zone": "GC",
# 						"description": "Future Government of Canada"
# 					}
# 				]
# 			}
# 		}
#
# 		result_eval = client.execute(query)
#
# 		self.assertDictEqual(result_refr, result_eval)
#
# 	def test_get_sector_by_zone(self):
# 		client = Client(schema)
# 		query = """
# 			query{
# 				getSectorByZone(zone: "GC_GA"){
# 					sector,
# 					zone,
# 					description
# 				}
# 			}
# 			"""
#
# 		result_refr = {
# 			"data": {
# 				"getSectorByZone": [
# 					{
# 						"sector": "GC",
# 						"zone": "GC_GA",
# 						"description": "Government Administration"
# 					}
# 				]
# 			}
# 		}
#
# 		result_eval = client.execute(query)
#
# 		self.assertDictEqual(result_refr, result_eval)
