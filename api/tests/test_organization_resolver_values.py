import sys
import os
from os.path import dirname, join, expanduser, normpath, realpath

import pytest
from flask import Request
from graphene.test import Client
from flask_bcrypt import Bcrypt

from unittest import TestCase

from werkzeug.test import create_environ

from manage import seed, remove_seed

seed()
from app import app
from db import db
from models import Organizations, Domains, Users, User_affiliations
from queries import schema
from backend.security_check import SecurityAnalysisBackend
remove_seed()

# This is the only way I could get imports to work for unit testing.
PACKAGE_PARENT = '..'
SCRIPT_DIR = dirname(realpath(join(os.getcwd(), expanduser(__file__))))
sys.path.append(normpath(join(SCRIPT_DIR, PACKAGE_PARENT)))


@pytest.fixture(scope='class')
def org_perm_test_db_init():
    db.init_app(app)
    bcrypt = Bcrypt(app)

    with app.app_context():
        test_user = Users(
            id=1,
            display_name="testuserread",
            user_name="testuserread@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123").decode("UTF-8"),
        )
        db.session.add(test_user)
        test_super_admin = Users(
            id=2,
            display_name="testsuperadmin",
            user_name="testsuperadmin@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123").decode("UTF-8")
        )
        db.session.add(test_super_admin)

        org = Organizations(
            id=1,
            acronym='ORG1',
            org_tags={
                "description": "Organization 1",
                "zone": "Prov",
                "sector": "Banking",
                "prov": "Alberta",
                "city": "Calgary"
            }
        )
        db.session.add(org)
        org = Organizations(
            id=2,
            acronym='ORG2',
            org_tags={
                "description": "Organization 2",
                "zone": "Muni",
                "sector": "Transportation",
                "prov": "NS",
                "city": "Halifax"
            }
        )
        db.session.add(org)
        org = Organizations(
            id=3,
            acronym='ORG3',
            org_tags={
                "description": "Organization 3",
                "zone": "Federal",
                "sector": "Arts",
                "prov": "Ontario",
                "city": "Toronto"
            }
        )
        db.session.add(org)

        test_admin_role = User_affiliations(
            user_id=1,
            organization_id=1,
            permission='user_read'
        )
        db.session.add(test_admin_role)
        test_admin_role = User_affiliations(
            user_id=2,
            organization_id=1,
            permission='super_admin'
        )
        db.session.add(test_admin_role)

        domain = Domains(
            id=1,
            domain='somecooldomain.ca',
            organization_id=1
        )
        db.session.add(domain)
        domain = Domains(
            id=2,
            domain='anothercooldomain.ca',
            organization_id=2
        )
        db.session.add(domain)
        domain = Domains(
            id=3,
            domain='somelamedomain.ca',
            organization_id=3
        )
        db.session.add(domain)
        db.session.commit()

    yield

    with app.app_context():
        Domains.query.delete()
        User_affiliations.query.delete()
        Organizations.query.delete()
        Users.query.delete()
        db.session.commit()


@pytest.mark.usefixtures('org_perm_test_db_init')
class TestOrgResolverWithOrgsAndValues(TestCase):
    # Super Admin Tests
    def test_get_org_resolvers_by_org_super_admin_single_node(self):
        """
        Test org resolver by organization as a super admin, single node return
        with all values
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                '''
                mutation{
                    signIn(userName:"testsuperadmin@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                ''', backend=backend)
            assert get_token['data']['signIn']['authToken'] is not None
            token = get_token['data']['signIn']['authToken']
            assert token is not None

            environ = create_environ()
            environ.update(
                HTTP_AUTHORIZATION=token
            )
            request_headers = Request(environ)

            executed = client.execute(
                '''
                {
                    organization(org: ORG1) {
                        edges {
                            node {
                                acronym
                                description
                                zone
                                sector
                                province
                                city
                                domains {
                                    edges {
                                        node {
                                            url
                                        }
                                    }
                                }
                                affiliatedUsers {
                                    edges {
                                        node {
                                            user {
                                                displayName
                                            }
                                            permission
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                ''', context_value=request_headers, backend=backend)
            result_refr = {
                "data": {
                    "organization": {
                        "edges": [
                            {
                                "node": {
                                    "acronym": "ORG1",
                                    "description": "Organization 1",
                                    "zone": "Prov",
                                    "sector": "Banking",
                                    "province": "Alberta",
                                    "city": "Calgary",
                                    "domains": {
                                        "edges": [
                                            {
                                                "node": {
                                                    "url": "somecooldomain.ca"
                                                }
                                            }
                                        ]
                                    },
                                    "affiliatedUsers": {
                                        "edges": [
                                            {
                                                "node": {
                                                    "user": {
                                                        "displayName": "testuserread"
                                                    },
                                                    "permission": "USER_READ"
                                                }
                                            },
                                            {
                                                "node": {
                                                    "user": {
                                                        "displayName": "testsuperadmin"
                                                    },
                                                    "permission": "SUPER_ADMIN"
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        ]
                    }
                }
            }
            self.assertDictEqual(result_refr, executed)

    def test_get_org_resolvers_super_admin_multi_node(self):
        """
        Test organization resolver as a super admin, multi node return with
        all values
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                '''
                mutation{
                    signIn(userName:"testsuperadmin@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                ''', backend=backend)
            assert get_token['data']['signIn']['authToken'] is not None
            token = get_token['data']['signIn']['authToken']
            assert token is not None

            environ = create_environ()
            environ.update(
                HTTP_AUTHORIZATION=token
            )
            request_headers = Request(environ)

            executed = client.execute(
                '''
                {
                    organizations {
                        edges {
                            node {
                                acronym
                                description
                                zone
                                sector
                                province
                                city
                                domains {
                                    edges {
                                        node {
                                            url
                                        }
                                    }
                                }
                                affiliatedUsers {
                                    edges {
                                        node {
                                            user {
                                                displayName
                                            }
                                            permission
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                ''', context_value=request_headers, backend=backend)
            result_refr = {
                    "data": {
                        "organizations": {
                            "edges": [
                                {
                                    "node": {
                                        "acronym": "ORG1",
                                        "description": "Organization 1",
                                        "zone": "Prov",
                                        "sector": "Banking",
                                        "province": "Alberta",
                                        "city": "Calgary",
                                        "domains": {
                                            "edges": [
                                                {
                                                    "node": {
                                                        "url": "somecooldomain.ca"
                                                    }
                                                }
                                            ]
                                        },
                                        "affiliatedUsers": {
                                            "edges": [
                                                {
                                                    "node": {
                                                        "user": {
                                                            "displayName": "testuserread"
                                                        },
                                                        "permission": "USER_READ"
                                                    }
                                                },
                                                {
                                                    "node": {
                                                        "user": {
                                                            "displayName": "testsuperadmin"
                                                        },
                                                        "permission": "SUPER_ADMIN"
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                },
                                {
                                    "node": {
                                        "acronym": "ORG2",
                                        "description": "Organization 2",
                                        "zone": "Muni",
                                        "sector": "Transportation",
                                        "province": "NS",
                                        "city": "Halifax",
                                        "domains": {
                                            "edges": [
                                                {
                                                    "node": {
                                                        "url": "anothercooldomain.ca"
                                                    }
                                                }
                                            ]
                                        },
                                        "affiliatedUsers": {
                                            "edges": []
                                        }
                                    }
                                },
                                {
                                    "node": {
                                        "acronym": "ORG3",
                                        "description": "Organization 3",
                                        "zone": "Federal",
                                        "sector": "Arts",
                                        "province": "Ontario",
                                        "city": "Toronto",
                                        "domains": {
                                            "edges": [
                                                {
                                                    "node": {
                                                        "url": "somelamedomain.ca"
                                                    }
                                                }
                                            ]
                                        },
                                        "affiliatedUsers": {
                                            "edges": []
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
            self.assertDictEqual(result_refr, executed)

    # User read tests
    def test_get_org_resolvers_by_org_user_read_single_node(self):
        """
        Test org resolver with an org as a user read, multi node return with
        all values
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                '''
                mutation{
                    signIn(userName:"testuserread@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                ''', backend=backend)
            assert get_token['data']['signIn']['authToken'] is not None
            token = get_token['data']['signIn']['authToken']
            assert token is not None

            environ = create_environ()
            environ.update(
                HTTP_AUTHORIZATION=token
            )
            request_headers = Request(environ)

            executed = client.execute(
                '''
                {
                    organization(org: ORG1) {
                        edges {
                            node {
                                acronym
                                description
                                zone
                                sector
                                province
                                city
                                domains {
                                    edges {
                                        node {
                                            url
                                        }
                                    }
                                }
                                affiliatedUsers {
                                    edges {
                                        node {
                                            user {
                                                displayName
                                            }
                                            permission
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                ''', context_value=request_headers, backend=backend)
            result_refr = {
                "data": {
                    "organization": {
                        "edges": [
                            {
                                "node": {
                                    "acronym": "ORG1",
                                    "description": "Organization 1",
                                    "zone": "Prov",
                                    "sector": "Banking",
                                    "province": "Alberta",
                                    "city": "Calgary",
                                    "domains": {
                                        "edges": [
                                            {
                                                "node": {
                                                    "url": "somecooldomain.ca"
                                                }
                                            }
                                        ]
                                    },
                                    "affiliatedUsers": {
                                        "edges": []
                                    }
                                }
                            }
                        ]
                    }
                }
            }
            self.assertDictEqual(result_refr, executed)

    def test_get_org_resolvers_by_org_user_read_multi_node(self):
        """
        Test organizations resolver as a user read, multi node return with
        all values
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                '''
                mutation{
                    signIn(userName:"testuserread@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                ''', backend=backend)
            assert get_token['data']['signIn']['authToken'] is not None
            token = get_token['data']['signIn']['authToken']
            assert token is not None

            environ = create_environ()
            environ.update(
                HTTP_AUTHORIZATION=token
            )
            request_headers = Request(environ)

            executed = client.execute(
                '''
                {
                    organizations {
                        edges {
                            node {
                                acronym
                                description
                                zone
                                sector
                                province
                                city
                                domains {
                                    edges {
                                        node {
                                            url
                                        }
                                    }
                                }
                                affiliatedUsers {
                                    edges {
                                        node {
                                            user {
                                                displayName
                                            }
                                            permission
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                ''', context_value=request_headers, backend=backend)
            result_refr = {
                "data": {
                    "organizations": {
                        "edges": [
                            {
                                "node": {
                                    "acronym": "ORG1",
                                    "description": "Organization 1",
                                    "zone": "Prov",
                                    "sector": "Banking",
                                    "province": "Alberta",
                                    "city": "Calgary",
                                    "domains": {
                                        "edges": [
                                            {
                                                "node": {
                                                    "url": "somecooldomain.ca"
                                                }
                                            }
                                        ]
                                    },
                                    "affiliatedUsers": {
                                        "edges": []
                                    }
                                }
                            }
                        ]
                    }
                }
            }
            self.assertDictEqual(result_refr, executed)


