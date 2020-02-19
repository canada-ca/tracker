import sys
import os
from os.path import dirname, join, expanduser, normpath, realpath

import pytest
from graphene.test import Client

from unittest import TestCase

from app import app
from queries import schema

# This is the only way I could get imports to work for unit testing.
PACKAGE_PARENT = '..'
SCRIPT_DIR = dirname(realpath(join(os.getcwd(), expanduser(__file__))))
sys.path.append(normpath(join(SCRIPT_DIR, PACKAGE_PARENT)))


class TestSectorResolver(TestCase):
    def test_get_scan_resolver_by_id(self):
        """Test get_sector_by_id resolver"""
        with app.app_context():
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
                                "domain": "bankofcanada.ca"
                            }
                        }
                    ]
                }
            }

            result_eval = client.execute(query)

        self.assertDictEqual(result_refr, result_eval)

    def test_get_scans_by_date(self):
        """Test get_scans_by_date resolver"""
        with app.app_context():
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
                                "domain": "bankofcanada.ca"
                            }
                        }
                    ]
                }
            }

            result_eval = client.execute(query)

            self.assertDictEqual(result_refr, result_eval)

    def test_scan_resolver_get_scans_by_date_range(self):
        """Test get_scans_by_date_range resolver"""
        with app.app_context():
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
                                "domain": "bankofcanada.ca"
                            }
                        },
                        {
                            "scanDate": "2020-02-15T09:43:17",
                            "domain": {
                                "domain": "bankofcanada.ca"
                            }
                        },
                        {
                            "scanDate": "2020-02-17T09:43:22",
                            "domain": {
                                "domain": "bankofcanada.ca"
                            }
                        }
                    ]
                }
            }

            result_eval = client.execute(query)

            self.assertDictEqual(result_refr, result_eval)

    def test_scan_resolver_get_scans_by_domain(self):
        """Test get_scans_by_domain resolver"""
        with app.app_context():
            client = Client(schema)
            query = """
            {
                getScansByDomain(url: "bankofcanada.ca") {
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
                                "domain": "bankofcanada.ca"
                            }
                        },
                        {
                            "scanDate": "2020-02-15T09:43:17",
                            "domain": {
                                "domain": "bankofcanada.ca"
                            }
                        },
                        {
                            "scanDate": "2020-02-17T09:43:22",
                            "domain": {
                                "domain": "bankofcanada.ca"
                            }
                        }
                    ]
                }
            }

            result_eval = client.execute(query)

            self.assertDictEqual(result_refr, result_eval)

    def test_scan_resolver_get_scans_by_user_id(self):
        """Test get_scans_by_user_id resolver"""
        with app.app_context():
            client = Client(schema)
            query = """
            {
                getScansByUserId(id: 1) {
                    id
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
                            "id": "U2NhbnM6MQ==",
                            "initiatedBy": 1,
                            "domain": {
                                "domain": "bankofcanada.ca"
                            }
                        },
                        {
                            "id": "U2NhbnM6Mg==",
                            "initiatedBy": 1,
                            "domain": {
                                "domain": "bankofcanada.ca"
                            }
                        },
                        {
                            "id": "U2NhbnM6Mw==",
                            "initiatedBy": 1,
                            "domain": {
                                "domain": "bankofcanada.ca"
                            }
                        }
                    ]
                }
            }

            result_eval = client.execute(query)

            self.assertDictEqual(result_refr, result_eval)

    def test_scan_resolver_by_id_invalid(self):
        """Test get_scan_by_id invalid ID error handling"""
        with app.app_context():
            client = Client(schema)
            query = """
            {
                getScanById(id: 9999){
                    id
                    domainId
                }
            }
            """
            executed = client.execute(query)

        assert executed['errors']
        assert executed['errors'][0]
        assert executed['errors'][0]['message'] == "Error, Invalid ID"

    def test_scan_resolver_by_date_invalid(self):
        """Test get_scan_by_date invalid date error handling"""
        with app.app_context():
            client = Client(schema)
            query = """
            {
                getScansByDate(date: "1970-01-01"){
                    id
                }
            }
            """
            executed = client.execute(query)

        assert executed['errors']
        assert executed['errors'][0]
        assert executed['errors'][0]['message'] == "Error, No scans occurred on that date"

    def test_scan_resolver_by_date_range_invalid(self):
        """Test get_scan_by_date_range invalid date range error handling"""
        with app.app_context():
            client = Client(schema)
            query = """
            {
                getScansByDateRange(startDate: "1970-01-01", endDate: "1980-01-01") {
                    id
                }
            }
            """
            executed = client.execute(query)

        assert executed['errors']
        assert executed['errors'][0]
        assert executed['errors'][0]['message'] == "Error, No scans in that date range"

    def test_scan_resolver_by_nonexsiting_domain_invalid(self):
        """Test get_scan_by_domain invalid domain error handling"""
        with app.app_context():
            client = Client(schema)
            query = """
            {
                getScansByDomain(url: "www.testfakedomain.ca") {
                    id
                }
            }
            """
            executed = client.execute(query)

        assert executed['errors']
        assert executed['errors'][0]
        assert executed['errors'][0]['message'] == "Error, no domain associated with that URL"

    def test_scan_resolver_by_domain_invalid(self):
        """Test get_scan_by_domain no scan assocaited with that domain error handling"""
        with app.app_context():
            client = Client(schema)
            query = """
            {
                getScansByDomain(url: "www.testdomain.ca") {
                    id
                }
            }
            """
            executed = client.execute(query)

        assert executed['errors']
        assert executed['errors'][0]
        assert executed['errors'][0]['message'] == "Error, no scans associated with that domain"

    def test_scan_resolver_by_user_id_invalid_no_scans(self):
        """Test get_scan_by_user_id cannot find associated scans"""
        with app.app_context():
            client = Client(schema)
            query = """
            {
                getScansByUserId(id: 2) {
                    id
                }
            }
            """
            executed = client.execute(query)

        assert executed['errors']
        assert executed['errors'][0]
        assert executed['errors'][0]['message'] == "Error, no scans initiated by that user"

    def test_scan_resolver_by_user_invalid_id(self):
        """Test get_scan_by_user_id cannot find id"""
        with app.app_context():
            client = Client(schema)
            query = """
            {
                getScansByUserId(id: 999) {
                    id
                }
            }
            """
            executed = client.execute(query)

        assert executed['errors']
        assert executed['errors'][0]
        assert executed['errors'][0]['message'] == "Error, cannot find user"
