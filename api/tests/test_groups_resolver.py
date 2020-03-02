import sys
import os
from os.path import dirname, join, expanduser, normpath, realpath

import pytest
from graphene.test import Client

from unittest import TestCase

from manage import seed, remove_seed

seed()
from app import app
from db import db
from models import Sectors, Groups
from queries import schema
from backend.depth_check import DepthAnalysisBackend
remove_seed()

# This is the only way I could get imports to work for unit testing.
PACKAGE_PARENT = '..'
SCRIPT_DIR = dirname(realpath(join(os.getcwd(), expanduser(__file__))))
sys.path.append(normpath(join(SCRIPT_DIR, PACKAGE_PARENT)))


@pytest.fixture(scope='class')
def group_test_db_init():
    db.init_app(app)
    with app.app_context():
        sector = Sectors(
            id=1,
            zone="ZO1",
            sector="SEC1",
            description="Sector 1"
        )
        db.session.add(sector)
        sector = Sectors(
            id=2,
            zone="ZO2",
            sector="SEC2",
            description="Sector 2"
        )
        db.session.add(sector)
        sector = Sectors(
            id=25,
            zone="TEST",
            sector="TEST_DEV",
            description="Development test cases"
        )
        db.session.add(sector)
        db.session.commit()
        group = Groups(
            id=1,
            s_group='GO1',
            description='Group 1',
            sector_id=1
        )
        db.session.add(group)
        group = Groups(
            id=2,
            s_group='GO2',
            description='Group 2',
            sector_id=2
        )
        db.session.add(group)

    yield

    with app.app_context():
        Groups.query.delete()
        Sectors.query.delete()
        db.session.commit()

@pytest.mark.usefixtures('group_test_db_init')
class TestGroupResolver(TestCase):
    def test_get_group_resolvers_by_id(self):
        """Test get_group_by_id resolver"""
        with app.app_context():
            backend = DepthAnalysisBackend()
            client = Client(schema)
            query = """
            {
                getGroupById(id:1) {
                    sGroup,
                    description
                }
            }"""
            result_refr = {
                "data": {
                    "getGroupById": [
                        {
                            "sGroup": "GO1",
                            "description": "Group 1"
                        }
                    ]
                }
            }

            result_eval = client.execute(query, backend=backend)
        self.assertDictEqual(result_refr, result_eval)

    def test_get_group_resolvers_by_group(self):
        """"Test get_group_by_group resolver"""
        with app.app_context():
            backend = DepthAnalysisBackend()
            client = Client(schema)
            query = """
            {
                getGroupByGroup(group: GO1){
                    description
                    sectorId
                }
            }"""
            result_refr = {
                "data": {
                    "getGroupByGroup": [
                        {
                            "description": "Group 1",
                            "sectorId": 1
                        }
                    ]
                }
            }

            result_eval = client.execute(query, backend=backend)
        self.assertDictEqual(result_refr, result_eval)

    def test_get_group_resolvers_by_sector(self):
        """Test get_group_by_sector_id resolver"""
        with app.app_context():
            backend = DepthAnalysisBackend()
            client = Client(schema)
            query = """
            {
                getGroupBySector(sector: SEC1){
                    description
                    groupSector{
                        zone
                        description
                    }
                }
            }"""
            result_refr = {
                "data": {
                    "getGroupBySector": [
                        {
                            "description": "Group 1",
                            "groupSector": {
                                "zone": "ZO1",
                                "description": "Sector 1"
                            }
                        }
                    ]
                }
            }

            result_eval = client.execute(query, backend=backend)
        self.assertDictEqual(result_refr, result_eval)

    def test_group_resolver_by_id_invalid(self):
        """Test get_group_by_id invalid ID error handling"""
        with app.app_context():
            backend = DepthAnalysisBackend()
            client = Client(schema)
            query = """
            {
                getGroupById(id: 9999){
                    id
                    description
                    sectorId
                }
            }"""
            executed = client.execute(query, backend=backend)

        assert executed['errors']
        assert executed['errors'][0]
        assert executed['errors'][0]['message'] == "Error, Invalid ID"

    def test_group_resolver_by_group_invalid(self):
        """Test get_group_by_group invalid sector error handling"""
        with app.app_context():
            backend = DepthAnalysisBackend()
            client = Client(schema)
            query = """
            {
                getGroupByGroup(group: fds){
                    id
                    description
                    sectorId
                }
            }"""
            executed = client.execute(query, backend=backend)

        assert executed['errors']
        assert executed['errors'][0]
        assert executed['errors'][0][
                   'message'] == f'Argument "group" has invalid value fds.\nExpected type "GroupEnums", found fds.'

    def test_group_resolver_by_sector_invalid(self):
        """Test get_group_by_sector invalid Zone error handling"""
        with app.app_context():
            backend = DepthAnalysisBackend()
            client = Client(schema)
            query = """
            {
                getGroupBySector(sector: dsa){
                    id
                    description
                    sectorId
                }
            }"""
            executed = client.execute(query, backend=backend)

        assert executed['errors']
        assert executed['errors'][0]
        assert executed['errors'][0][
                   'message'] == f'Argument "sector" has invalid value dsa.\nExpected type "SectorEnums", found dsa.'
