import sys
import os
from os.path import dirname, join, expanduser, normpath, realpath

import pytest
from graphene.test import Client

from flask_bcrypt import Bcrypt

from unittest import TestCase

from manage import seed, remove_seed

seed()
from api import app, db
from models import Scans, Domains, Users
from queries import schema
from backend.security_check import SecurityAnalysisBackend
remove_seed()

# This is the only way I could get imports to work for unit testing.
PACKAGE_PARENT = '..'
SCRIPT_DIR = dirname(realpath(join(os.getcwd(), expanduser(__file__))))
sys.path.append(normpath(join(SCRIPT_DIR, PACKAGE_PARENT)))


@pytest.fixture(scope='class')
def scans_test_db_init():
    db.init_app(app)
    with app.app_context():
        bcrypt = Bcrypt(app)
        user = Users(
            id=1,
            display_name="testuser",
            user_name="testuser@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123").decode("UTF-8")
        )
        db.session.add(user)
        user = Users(
            id=2
        )
        db.session.add(user)
        domain = Domains(
            id=1,
            domain='valid.canada.ca'
        )
        db.session.add(domain)
        domain = Domains(
            id=2,
            domain='www.testdomain.ca'
        )
        db.session.add(domain)
        scan = Scans(
            id=1,
            scan_date="2020-02-18T09:43:14",
            domain_id=1,
            initiated_by=1
        )
        db.session.add(scan)
        scan = Scans(
            id=2,
            scan_date="2020-02-15T09:43:17",
            domain_id=1,
            initiated_by=1
        )
        db.session.add(scan)
        db.session.commit()

    yield

    with app.app_context():
        Scans.query.delete()
        Domains.query.delete()
        Users.query.delete()
        db.session.commit()


@pytest.mark.usefixtures('scans_test_db_init')
class TestScansResolver(TestCase):
    def test_get_scan_resolver_by_id(self):
        """Test get_sector_by_id resolver"""
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            query = """
            {
                getScanById(id: 1) {
                    scanDate
                    domain {
                        domain
                    }
                }
            }
            """

            result_refr = {
                "data": {
                    "getScanById": [
                        {
                            "scanDate": "2020-02-18T09:43:14",
                            "domain": {
                                "domain": "valid.canada.ca"
                            }
                        }
                    ]
                }
            }

            result_eval = client.execute(query, backend=backend)

        self.assertDictEqual(result_refr, result_eval)

    def test_get_scans_by_date(self):
        """Test get_scans_by_date resolver"""
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            query = """
            {
                getScansByDate(date: "2020-02-18") {
                    scanDate
                    domain {
                        domain
                    }
                }
            }
            """

            result_refr = {
                "data": {
                    "getScansByDate": [
                        {
                            "scanDate": "2020-02-18T09:43:14",
                            "domain": {
                                "domain": "valid.canada.ca"
                            }
                        }
                    ]
                }
            }

            result_eval = client.execute(query, backend=backend)

            self.assertDictEqual(result_refr, result_eval)

    def test_scan_resolver_get_scans_by_date_range(self):
        """Test get_scans_by_date_range resolver"""
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            query = """
            {
                getScansByDateRange(startDate: "2020-02-15", endDate: "2020-02-18"){
                    scanDate
                    domain {
                        domain
                    }
                }
            }
            """

            result_refr = {
                "data": {
                    "getScansByDateRange": [
                        {
                            "scanDate": "2020-02-18T09:43:14",
                            "domain": {
                                "domain": "valid.canada.ca"
                            }
                        },
                        {
                            "scanDate": "2020-02-15T09:43:17",
                            "domain": {
                                "domain": "valid.canada.ca"
                            }
                        }
                    ]
                }
            }

            result_eval = client.execute(query, backend=backend)

            self.assertDictEqual(result_refr, result_eval)

    def test_scan_resolver_get_scans_by_domain(self):
        """Test get_scans_by_domain resolver"""
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            query = """
            {
                getScansByDomain(url: "valid.canada.ca") {
                    scanDate
                    domain {
                        domain
                    }
                }
            }
            """

            result_refr = {
                "data": {
                    "getScansByDomain": [
                        {
                            "scanDate": "2020-02-18T09:43:14",
                            "domain": {
                                "domain": "valid.canada.ca"
                            }
                        },
                        {
                            "scanDate": "2020-02-15T09:43:17",
                            "domain": {
                                "domain": "valid.canada.ca"
                            }
                        }
                    ]
                }
            }

            result_eval = client.execute(query, backend=backend)

            self.assertDictEqual(result_refr, result_eval)

    def test_scan_resolver_get_scans_by_user_id(self):
        """Test get_scans_by_user_id resolver"""
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            query = """
            {
                getScansByUserId(id: 1) {
                    initiatedBy
                    domain {
                        domain
                    }
                }
            }
            """

            result_refr = {
                "data": {
                    "getScansByUserId": [
                        {
                            "initiatedBy": 1,
                            "domain": {
                                "domain": "valid.canada.ca"
                            }
                        },
                        {
                            "initiatedBy": 1,
                            "domain": {
                                "domain": "valid.canada.ca"
                            }
                        }
                    ]
                }
            }

            result_eval = client.execute(query, backend=backend)

            self.assertDictEqual(result_refr, result_eval)

    def test_scan_resolver_by_id_invalid(self):
        """Test get_scan_by_id invalid ID error handling"""
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            query = """
            {
                getScanById(id: 9999){
                    id
                    domainId
                }
            }
            """
            executed = client.execute(query, backend=backend)

        assert executed['errors']
        assert executed['errors'][0]
        assert executed['errors'][0]['message'] == "Error, Invalid ID"

    def test_scan_resolver_by_date_invalid(self):
        """Test get_scan_by_date invalid date error handling"""
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            query = """
            {
                getScansByDate(date: "1970-01-01"){
                    id
                }
            }
            """
            executed = client.execute(query, backend=backend)

        assert executed['errors']
        assert executed['errors'][0]
        assert executed['errors'][0]['message'] == "Error, No scans occurred on that date"

    def test_scan_resolver_by_date_range_invalid(self):
        """Test get_scan_by_date_range invalid date range error handling"""
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            query = """
            {
                getScansByDateRange(startDate: "1970-01-01", endDate: "1980-01-01") {
                    id
                }
            }
            """
            executed = client.execute(query, backend=backend)

        assert executed['errors']
        assert executed['errors'][0]
        assert executed['errors'][0]['message'] == "Error, No scans in that date range"

    def test_scan_resolver_by_nonexsiting_domain_invalid(self):
        """Test get_scan_by_domain invalid domain error handling"""
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            query = """
            {
                getScansByDomain(url: "www.testfakedomain.ca") {
                    id
                }
            }
            """
            executed = client.execute(query, backend=backend)

        assert executed['errors']
        assert executed['errors'][0]
        assert executed['errors'][0]['message'] == "Error, no domain associated with that URL"

    def test_scan_resolver_by_domain_invalid(self):
        """Test get_scan_by_domain no scan assocaited with that domain error handling"""
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            query = """
            {
                getScansByDomain(url: "www.testdomain.ca") {
                    id
                }
            }
            """
            executed = client.execute(query, backend=backend)

        assert executed['errors']
        assert executed['errors'][0]
        assert executed['errors'][0]['message'] == "Error, no scans associated with that domain"

    def test_scan_resolver_by_user_id_invalid_no_scans(self):
        """Test get_scan_by_user_id cannot find associated scans"""
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            query = """
            {
                getScansByUserId(id: 2) {
                    id
                }
            }
            """
            executed = client.execute(query, backend=backend)

        assert executed['errors']
        assert executed['errors'][0]
        assert executed['errors'][0]['message'] == "Error, no scans initiated by that user"

    def test_scan_resolver_by_user_invalid_id(self):
        """Test get_scan_by_user_id cannot find id"""
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            query = """
            {
                getScansByUserId(id: 999) {
                    id
                }
            }
            """
            executed = client.execute(query, backend=backend)

        assert executed['errors']
        assert executed['errors'][0]
        assert executed['errors'][0]['message'] == "Error, cannot find user"
