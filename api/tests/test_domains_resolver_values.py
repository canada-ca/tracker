import sys
import os
from os.path import dirname, join, expanduser, normpath, realpath

import pytest
from flask import Request
from graphene.test import Client
from flask_bcrypt import Bcrypt

from unittest import TestCase

from werkzeug.test import create_environ

# This is the only way I could get imports to work for unit testing.
PACKAGE_PARENT = '..'
SCRIPT_DIR = dirname(realpath(join(os.getcwd(), expanduser(__file__))))
sys.path.append(normpath(join(SCRIPT_DIR, PACKAGE_PARENT)))

from app import app
from db import db
from models import (
    Organizations,
    Domains,
    Users,
    User_affiliations,
    Dmarc_Reports,
    Scans,
    Dkim_scans,
    Dmarc_scans,
    Https_scans,
    Mx_scans,
    Spf_scans,
    Ssl_scans
)
from queries import schema
from backend.security_check import SecurityAnalysisBackend


@pytest.fixture(scope='class')
def domain_test_db_init():
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

        org = Organizations(
            id=1,
            acronym='ORG1',
            org_tags={
                "description": 'Organization 1'
            }
        )
        db.session.add(org)

        test_user_read_role = User_affiliations(
            user_id=1,
            organization_id=1,
            permission='user_read'
        )
        db.session.add(test_user_read_role)

        domain = Domains(
            id=1,
            domain='accurateplastics.com',
            organization_id=1
        )
        db.session.add(domain)

        test_dmarc_report = Dmarc_Reports(
            id=1,
            domain_id=1,
            report={
                "xml_schema": "draft",
                "report_metadata": {
                    "org_name": "accurateplastics.com",
                    "org_email": "administrator@accurateplastics.com",
                    "org_extra_contact_info": "null",
                    "report_id": "example.com:1538463741",
                    "begin_date": "2018-10-01 13:07:12",
                    "end_date": "2018-10-01 13:07:12",
                    "errors": [
                        "Invalid XML: not well-formed (invalid token): line 5, column 17"
                    ]
                },
                "policy_published": {
                    "domain": "example.com",
                    "adkim": "r",
                    "aspf": "r",
                    "p": "none",
                    "sp": "reject",
                    "pct": "100",
                    "fo": "0"
                },
                "records": [
                    {
                        "source": {
                            "ip_address": "12.20.127.122",
                            "country": "US",
                            "reverse_dns": "null",
                            "base_domain": "null"
                        },
                        "count": 1,
                        "alignment": {
                            "spf": False,
                            "dkim": False,
                            "dmarc": False
                        },
                        "policy_evaluated": {
                            "disposition": "none",
                            "dkim": "fail",
                            "spf": "fail",
                            "policy_override_reasons": [
                                "TESTING TEXT"
                            ]
                        },
                        "identifiers": {
                            "header_from": "example.com",
                            "envelope_from": "null",
                            "envelope_to": "null"
                        },
                        "auth_results": {
                            "dkim": [
                                {
                                    "domain": "toptierhighticket.club",
                                    "selector": "default",
                                    "result": "pass"
                                }
                            ],
                            "spf": [
                                {
                                    "domain": "null",
                                    "scope": "mfrom",
                                    "result": "none"
                                }
                            ]
                        }
                    }
                ]
            }
        )
        db.session.add(test_dmarc_report)
        db.session.commit()

    yield

    with app.app_context():
        Dkim_scans.query.delete()
        Dmarc_scans.query.delete()
        Https_scans.query.delete()
        Mx_scans.query.delete()
        Spf_scans.query.delete()
        Ssl_scans.query.delete()
        Scans.query.delete()
        Dmarc_Reports.queery.delete()
        Domains.query.delete()
        User_affiliations.query.delete()
        Organizations.query.delete()
        Users.query.delete()
        db.session.commit()


@pytest.mark.usefixtures('domain_test_db_init')
class TestDomainsResolver(TestCase):
    def test_get_domain_resolver_dmarc_report(self):
        """
        Test to see if all values appear
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
                    domain(url: "accurateplastics.com") {
                        url
                        dmarcReport {
                            edges {
                                node {
                                    reportId
                                    orgName
                                    orgEmail
                                    startDate
                                    endDate
                                    errors
                                    records {
                                        count
                                        source {
                                            ipAddress
                                            country
                                            reverseDns
                                            baseDomain
                                        }
                                        alignment {
                                            spf
                                            dkim
                                            dmarc
                                        }
                                        policyEvaluated {
                                            disposition
                                            dkim
                                            spf
                                            policyOverrideReasons
                                        }
                                        identifiers {
                                            headerFrom
                                            envelopeFrom
                                            envelopTo
                                        }
                                        authResults {
                                            dkim {
                                                domain
                                                selector
                                                result
                                            }
                                            spf {
                                                domain
                                                scope
                                                result
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                ''', context_value=request_headers, backend=backend)
            result_refr ={
                "data": {
                    "domain": [
                        {
                            "url": "accurateplastics.com",
                            "dmarcReport": {
                                "edges": [
                                    {
                                        "node": {
                                            "reportId": "example.com:1538463741",
                                            "orgName": "accurateplastics.com",
                                            "orgEmail": "administrator@accurateplastics.com",
                                            "startDate": "2018-10-01T13:07:12",
                                            "endDate": "2018-10-01T13:07:12",
                                            "errors": [
                                                "Invalid XML: not well-formed (invalid token): line 5, column 17"
                                            ],
                                            "records": [
                                                {
                                                    "count": 1,
                                                    "source": {
                                                        "ipAddress": "12.20.127.122",
                                                        "country": "US",
                                                        "reverseDns": "null",
                                                        "baseDomain": "null"
                                                    },
                                                    "alignment": {
                                                        "spf": False,
                                                        "dkim": False,
                                                        "dmarc": False
                                                    },
                                                    "policyEvaluated": {
                                                        "disposition": "none",
                                                        "dkim": "fail",
                                                        "spf": "fail",
                                                        "policyOverrideReasons": [
                                                            "TESTING TEXT"
                                                        ]
                                                    },
                                                    "identifiers": {
                                                        "headerFrom": "example.com",
                                                        "envelopeFrom": "null",
                                                        "envelopTo": "null"
                                                    },
                                                    "authResults": {
                                                        "dkim": [
                                                            {
                                                                "domain": "toptierhighticket.club",
                                                                "selector": "default",
                                                                "result": "pass"
                                                            }
                                                        ],
                                                        "spf": [
                                                            {
                                                                "domain": "null",
                                                                "scope": "mfrom",
                                                                "result": "none"
                                                            }
                                                        ]
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
            self.maxDiff = None
            self.assertDictEqual(result_refr, executed)
