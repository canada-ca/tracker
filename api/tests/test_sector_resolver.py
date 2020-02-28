import sys
import os
from os.path import dirname, join, expanduser, normpath, realpath

import pytest
from graphene.test import Client

from unittest import TestCase

from manage import seed, remove_seed

seed()
from api import app, db
from models import Sectors
from queries import schema
from backend.security_check import SecurityAnalysisBackend
remove_seed()

# This is the only way I could get imports to work for unit testing.
PACKAGE_PARENT = '..'
SCRIPT_DIR = dirname(realpath(join(os.getcwd(), expanduser(__file__))))
sys.path.append(normpath(join(SCRIPT_DIR, PACKAGE_PARENT)))


@pytest.fixture(scope='class')
def sector_test_db_init():
    db.init_app(app)
    with app.app_context():
        sector = Sectors(
            id=1,
            zone="ZO1",
            sector="SEC1",
            description="Sector 1"
        )
        with app.app_context():
            db.session.add(sector)
            db.session.commit()

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

    yield

    with app.app_context():
        Sectors.query.delete()
        db.session.commit()


@pytest.mark.usefixtures('sector_test_db_init')
class TestSectorResolver(TestCase):
    def test_get_sector_resolver_by_id(self):
        """Test get_sector_by_id resolver"""
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            query = """
            {
                getSectorById(id: 1) {
                    sector
                    zone
                    description
                }
            }"""
            result_refr = {
                "data": {
                    "getSectorById": [
                        {
                            "sector": "SEC1",
                            "zone": "ZO1",
                            "description": "Sector 1"
                        }
                    ]
                }
            }

            result_eval = client.execute(query, backend=backend)

        self.assertDictEqual(result_refr, result_eval)

    def test_get_sector_resolver_by_sector(self):
        """Test get_sector_by_sector resolver"""
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            query = """
            {
                getSectorsBySector(sector: SEC1){
                    zone
                    description
                }
            }"""
            result_refr = {
                "data": {
                    "getSectorsBySector": [
                        {
                            "zone": "ZO1",
                            "description": "Sector 1"
                        }
                    ]
                }
            }

            result_eval = client.execute(query, backend=backend)

        self.assertDictEqual(result_refr, result_eval)

    def test_get_sector_resolver_by_zone(self):
        """Test get_sector_by_zone resolver"""
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            query = """
            {
                getSectorByZone(zone: TEST) {
                    sector
                    description
                }
            }"""
            result_refr = {
                "data": {
                    "getSectorByZone": [
                        {
                            "sector": "TEST_DEV",
                            "description": "Development test cases"
                        }
                    ]
                }
            }

            result_eval = client.execute(query, backend=backend)

        self.assertDictEqual(result_refr, result_eval)

    def test_sector_resolver_by_id_invalid(self):
        """Test get_sector_by_id invalid ID error handling"""
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            query = """
            {
                getSectorById(id: 9999){
                    id
                    sector
                    zone
                    description
                }
            }"""
            executed = client.execute(query, backend=backend)

        assert executed['errors']
        assert executed['errors'][0]
        assert executed['errors'][0]['message'] == "Error, Invalid ID"

    def test_sector_resolver_by_sector_invalid(self):
        """Test get_sector_by_sector invalid sector error handling"""
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            query = """
            {
                getSectorsBySector(sector: str) {
                    id
                    zone
                    description
                }
            }"""
            executed = client.execute(query, backend=backend)

        assert executed['errors']
        assert executed['errors'][0]
        assert executed['errors'][0]['message'] == f'Argument "sector" has invalid value str.\nExpected type "SectorEnums", found str.'

    def test_sector_resolver_by_zone_invalid(self):
        """Test get_sector_by_zone invalid Zone error handling"""
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            query = """
            {
                getSectorByZone(zone: str) {
                    id
                    sector
                    zone
                    description
                }
            }"""
            executed = client.execute(query, backend=backend)

        assert executed['errors']
        assert executed['errors'][0]
        assert executed['errors'][0]['message'] == f'Argument "zone" has invalid value str.\nExpected type "ZoneEnums", found str.'
