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
from db import db_session
from models import (
    Organizations,
    Domains,
    Users,
    User_affiliations,
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
def organization_mutation_db_init():
    bcrypt = Bcrypt(app)

    with app.app_context():
        test_super_admin = Users(
            id=1,
            display_name="testsuperadmin",
            user_name="testsuperadmin@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123").decode("UTF-8")
        )
        db_session.add(test_super_admin)
        test_admin = Users(
            id=2,
            display_name="testadmin",
            user_name="testadmin@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123").decode("UTF-8")
        )
        db_session.add(test_admin)
        test_write = Users(
            id=3,
            display_name="testuserwrite",
            user_name="testuserwrite@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123").decode("UTF-8")
        )
        db_session.add(test_write)
        test_read = Users(
            id=4,
            display_name="testuserread",
            user_name="testuserread@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123").decode("UTF-8"),
        )
        db_session.add(test_read)

        # Super Admin Test Values
        sa_org = Organizations(
            acronym='SA'
        )
        db_session.add(sa_org)
        db_session.commit()
        org_orm = db_session.query(Organizations).filter(
            Organizations.acronym == 'SA'
        ).first()
        sa_user_aff = User_affiliations(
            organization_id=org_orm.id,
            user_id=1,
            permission='super_admin'
        )
        db_session.add(sa_user_aff)
        db_session.commit()
        sa_check_org = Organizations(
            acronym="SA_CHECK"
        )
        db_session.add(sa_check_org)
        sa_update_org = Organizations(
            acronym="SA_UPDATE"
        )
        db_session.add(sa_update_org)
        sa_delete_org = Organizations(
            acronym="SA_DELETE"
        )
        db_session.add(sa_delete_org)
        db_session.commit()
        org_orm = db_session.query(Organizations).filter(
            Organizations.acronym == 'SA_DELETE'
        ).first()
        sa_domain = Domains(
            id=1,
            organization_id=org_orm.id
        )
        db_session.add(sa_domain)
        sa_scan = Scans(
            id=1,
            domain_id=1
        )
        db_session.add(sa_scan)
        db_session.commit()
        sa_dkim = Dkim_scans(
            id=1
        )
        db_session.add(sa_dkim)
        sa_dmarc = Dmarc_scans(
            id=1
        )
        db_session.add(sa_dmarc)
        sa_https = Https_scans(
            id=1
        )
        db_session.add(sa_https)
        sa_mx = Mx_scans(
            id=1
        )
        db_session.add(sa_mx)
        sa_spf = Spf_scans(
            id=1
        )
        db_session.add(sa_spf)
        sa_ssl = Ssl_scans(
            id=1
        )
        db_session.add(sa_ssl)
        db_session.commit()

        # Admin Db Inserts
        admin_org = Organizations(
            acronym="ADMIN_ORG"
        )
        db_session.add(admin_org)
        db_session.commit()
        org_orm = db_session.query(Organizations).filter(
            Organizations.acronym == 'ADMIN_ORG'
        ).first()
        admin_aff = User_affiliations(
            organization_id=org_orm.id,
            user_id=2,
            permission='admin'
        )
        db_session.add(admin_aff)

        # User Write Db Inserts
        user_write_org = Organizations(
            acronym="USER_W_ORG"
        )
        db_session.add(user_write_org)
        db_session.commit()
        org_orm = db_session.query(Organizations).filter(
            Organizations.acronym == 'USER_W_ORG'
        ).first()
        user_write_aff = User_affiliations(
            organization_id=org_orm.id,
            user_id=3,
            permission='user_write'
        )
        db_session.add(user_write_aff)

        # User Read Db Inserts
        user_read_org = Organizations(
            acronym="USER_R_ORG"
        )
        db_session.add(user_read_org)
        db_session.commit()
        org_orm = db_session.query(Organizations).filter(
            Organizations.acronym == 'USER_R_ORG'
        ).first()
        user_read_aff = User_affiliations(
            organization_id=org_orm.id,
            user_id=4,
            permission='user_read'
        )
        db_session.add(user_read_aff)
        db_session.commit()

    yield

    with app.app_context():
        Dkim_scans.query.delete()
        Dmarc_scans.query.delete()
        Https_scans.query.delete()
        Mx_scans.query.delete()
        Spf_scans.query.delete()
        Ssl_scans.query.delete()
        Scans.query.delete()
        Domains.query.delete()
        User_affiliations.query.delete()
        Organizations.query.delete()
        Users.query.delete()
        db_session.commit()


@pytest.mark.usefixtures('organization_mutation_db_init')
class TestOrganizationMutations(TestCase):
    # Super Admin Tests
    def test_sa_org_mutation_create_org(self):
        """
        Test To See If SA Can Create Organization
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
                mutation {
                    createOrganization(
                        acronym: "TEST_ORG"
                        description: "Test Organization"
                        zone: "Test Zone"
                        sector: "Test Sector"
                        province: "Nova Scotia"
                        city: "Halifax"
                    ) {
                        status
                    }
                }
                ''', context_value=request_headers, backend=backend)

            assert executed['data']
            assert executed['data']['createOrganization']
            assert executed['data']['createOrganization']['status']

            executed = client.execute(
                '''
                {
                    organization(org: "TEST_ORG") {
                        edges {
                            node {
                                acronym
                                description
                                zone
                                sector
                                province
                                city
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
                                    "acronym": "TEST_ORG",
                                    "description": "Test Organization",
                                    "zone": "Test Zone",
                                    "sector": "Test Sector",
                                    "province": "Nova Scotia",
                                    "city": "Halifax"
                                }
                            }
                        ]
                    }
                }
            }
            self.assertDictEqual(result_refr, executed)

    def test_sa_org_mutation_create_org_already_exists(self):
        """
        Test Error Check For Existing Org
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
                mutation {
                    createOrganization(
                        acronym: "SA_CHECK"
                        description: "Test Organization"
                        zone: "Test Zone"
                        sector: "Test Sector"
                        province: "Nova Scotia"
                        city: "Halifax"
                    ) {
                        status
                    }
                }
                ''', context_value=request_headers, backend=backend)

            assert executed['errors']
            assert executed['errors'][0]
            assert executed['errors'][0]['message'] == "Error, Organization alredy exists"

    def test_sa_org_mutation_update_org(self):
        """
        Test To See If SA Can Update an Organization
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
                mutation {
                    updateOrganization(
                        acronym: "TEST_ORG"
                        updatedAcronym: "NEW_ORG"
                        description: "Test Organization"
                        zone: "Test Zone"
                        sector: "Test Sector"
                        province: "Nova Scotia"
                        city: "Halifax"
                    ) {
                        status
                    }
                }
                ''', context_value=request_headers, backend=backend)

            assert executed['data']
            assert executed['data']['updateOrganization']
            assert executed['data']['updateOrganization']['status']

            executed = client.execute(
                '''
                {
                    organization(org: "NEW_ORG") {
                        edges {
                            node {
                                acronym
                                description
                                zone
                                sector
                                province
                                city
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
                                    "acronym": "NEW_ORG",
                                    "description": "Test Organization",
                                    "zone": "Test Zone",
                                    "sector": "Test Sector",
                                    "province": "Nova Scotia",
                                    "city": "Halifax"
                                }
                            }
                        ]
                    }
                }
            }
            self.assertDictEqual(result_refr, executed)

    def test_sa_org_mutation_update_org_acronym_already_in_use(self):
        """
        Test To See Error appears when acronym already taken
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
                mutation {
                    updateOrganization(
                        acronym: "SA_UPDATE"
                        updatedAcronym: "SA"
                        description: "Test Organization"
                        zone: "Test Zone"
                        sector: "Test Sector"
                        province: "Nova Scotia"
                        city: "Halifax"
                    ) {
                        status
                    }
                }
                ''', context_value=request_headers, backend=backend)

            assert executed['errors']
            assert executed['errors'][0]
            assert executed['errors'][0]['message'] == "Error, acronym already in use."

    def test_sa_org_mutation_update_org_does_not_exist(self):
        """
        Test To See Error appears when org does not exist
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
                mutation {
                    updateOrganization(
                        acronym: "TEST_ORG"
                        updatedAcronym: "SA"
                        description: "Test Organization"
                        zone: "Test Zone"
                        sector: "Test Sector"
                        province: "Nova Scotia"
                        city: "Halifax"
                    ) {
                        status
                    }
                }
                ''', context_value=request_headers, backend=backend)

            assert executed['errors']
            assert executed['errors'][0]
            assert executed['errors'][0]['message'] == "Error, organization does not exist."

    def test_sa_org_mutation_remove_org(self):
        """
        Test To See If SA Can Remove an Organization
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

            org_id = db_session.query(Organizations).filter(
                Organizations.acronym == 'SA_DELETE'
            ).first().id

            executed = client.execute(
                '''
                mutation {
                    removeOrganization(
                        acronym: "SA_DELETE"
                    ) {
                        status
                    }
                }
                ''', context_value=request_headers, backend=backend)

            assert executed['data']
            assert executed['data']['removeOrganization']
            assert executed['data']['removeOrganization']['status']

            check_org_orm = db_session.query(Organizations).filter(
                Organizations.acronym == 'SA_DELETE'
            ).first()
            assert check_org_orm is None

            check_user_aff = db_session.query(User_affiliations).filter(
                User_affiliations.organization_id == org_id
            ).all()
            assert not check_user_aff

            assert not db_session.query(Domains).all()
            assert not db_session.query(Scans).all()
            assert not db_session.query(Ssl_scans).all()
            assert not db_session.query(Spf_scans).all()
            assert not db_session.query(Mx_scans).all()
            assert not db_session.query(Https_scans).all()
            assert not db_session.query(Dmarc_scans).all()
            assert not db_session.query(Dkim_scans).all()

    def test_sa_org_mutation_remove_org_sa_org(self):
        """
        Test To See If SA Can't Remove SA Organization
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
                mutation {
                    removeOrganization(
                        acronym: "SA"
                    ) {
                        status
                    }
                }
                ''', context_value=request_headers, backend=backend)

            assert executed['errors']
            assert executed['errors'][0]
            assert executed['errors'][0]['message'] == "Error, you cannot remove this organization"

    def test_sa_org_mutation_remove_org_does_not_exist(self):
        """
        Test Error appears when trying to remove an org that doesn't exist
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
                mutation {
                    removeOrganization(
                        acronym: "RANDOM"
                    ) {
                        status
                    }
                }
                ''', context_value=request_headers, backend=backend)

            assert executed['errors']
            assert executed['errors'][0]
            assert executed['errors'][0]['message'] == "Error, organization does not exist"

    # Admin Test
    def test_admin_org_mutation_create_org_fail(self):
        """
        Test That Admin can't create orgs
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                '''
                mutation{
                    signIn(userName:"testadmin@testemail.ca", password:"testpassword123"){
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
                mutation {
                    createOrganization(
                        acronym: "ADMIN_NEW"
                        description: "Test Organization"
                        zone: "Test Zone"
                        sector: "Test Sector"
                        province: "Nova Scotia"
                        city: "Halifax"
                    ) {
                        status
                    }
                }
                ''', context_value=request_headers, backend=backend)

            assert executed['errors']
            assert executed['errors'][0]
            assert executed['errors'][0]['message'] == "Error, you do not have permission to create organizations"

    def test_admin_org_mutation_update_org_fail(self):
        """
        Test That Admin can't update orgs
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                '''
                mutation{
                    signIn(userName:"testadmin@testemail.ca", password:"testpassword123"){
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
                mutation {
                    updateOrganization(
                        acronym: "ADMIN_ORG"
                        description: "Test Organization"
                        zone: "Test Zone"
                        sector: "Test Sector"
                        province: "Nova Scotia"
                        city: "Halifax"
                    ) {
                        status
                    }
                }
                ''', context_value=request_headers, backend=backend)

            assert executed['errors']
            assert executed['errors'][0]
            assert executed['errors'][0]['message'] == "Error, you do not have permission to update organizations"

    def test_admin_org_mutation_remove_org_fail(self):
        """
        Test That Admin can't remove orgs
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                '''
                mutation{
                    signIn(userName:"testadmin@testemail.ca", password:"testpassword123"){
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
                mutation {
                    removeOrganization(
                        acronym: "ADMIN_ORG"
                    ) {
                        status
                    }
                }
                ''', context_value=request_headers, backend=backend)

            assert executed['errors']
            assert executed['errors'][0]
            assert executed['errors'][0]['message'] == "Error, you do not have permission to remove organizations."

    # User Write Test
    def test_user_write_org_mutation_create_org_fail(self):
        """
        Test That User Write can't create orgs
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                '''
                mutation{
                    signIn(userName:"testuserwrite@testemail.ca", password:"testpassword123"){
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
                mutation {
                    createOrganization(
                        acronym: "USER_W_NEW"
                        description: "Test Organization"
                        zone: "Test Zone"
                        sector: "Test Sector"
                        province: "Nova Scotia"
                        city: "Halifax"
                    ) {
                        status
                    }
                }
                ''', context_value=request_headers, backend=backend)

            assert executed['errors']
            assert executed['errors'][0]
            assert executed['errors'][0]['message'] == "Error, you do not have permission to create organizations"

    def test_user_write_org_mutation_update_org_fail(self):
        """
        Test That User Write can't update orgs
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                '''
                mutation{
                    signIn(userName:"testuserwrite@testemail.ca", password:"testpassword123"){
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
                mutation {
                    updateOrganization(
                        acronym: "USER_W_ORG"
                        description: "Test Organization"
                        zone: "Test Zone"
                        sector: "Test Sector"
                        province: "Nova Scotia"
                        city: "Halifax"
                    ) {
                        status
                    }
                }
                ''', context_value=request_headers, backend=backend)

            assert executed['errors']
            assert executed['errors'][0]
            assert executed['errors'][0]['message'] == "Error, you do not have permission to update organizations"

    def test_user_write_org_mutation_remove_org_fail(self):
        """
        Test That User Write can't remove orgs
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                '''
                mutation{
                    signIn(userName:"testuserwrite@testemail.ca", password:"testpassword123"){
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
                mutation {
                    removeOrganization(
                        acronym: "USER_W_ORG"
                    ) {
                        status
                    }
                }
                ''', context_value=request_headers, backend=backend)

            assert executed['errors']
            assert executed['errors'][0]
            assert executed['errors'][0]['message'] == "Error, you do not have permission to remove organizations."

    # User Read Test
    def test_user_read_org_mutation_create_org_fail(self):
        """
        Test That user read can't create orgs
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
                mutation {
                    createOrganization(
                        acronym: "USER_R_NEW"
                        description: "Test Organization"
                        zone: "Test Zone"
                        sector: "Test Sector"
                        province: "Nova Scotia"
                        city: "Halifax"
                    ) {
                        status
                    }
                }
                ''', context_value=request_headers, backend=backend)

            assert executed['errors']
            assert executed['errors'][0]
            assert executed['errors'][0]['message'] == "Error, you do not have permission to create organizations"

    def test_user_read_org_mutation_update_org_fail(self):
        """
        Test That user read can't update orgs
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
                mutation {
                    updateOrganization(
                        acronym: "USER_R_ORG"
                        description: "Test Organization"
                        zone: "Test Zone"
                        sector: "Test Sector"
                        province: "Nova Scotia"
                        city: "Halifax"
                    ) {
                        status
                    }
                }
                ''', context_value=request_headers, backend=backend)

            assert executed['errors']
            assert executed['errors'][0]
            assert executed['errors'][0]['message'] == "Error, you do not have permission to update organizations"

    def test_user_read_org_mutation_remove_org_fail(self):
        """
        Test That user read can't remove orgs
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
                mutation {
                    removeOrganization(
                        acronym: "USER_R_ORG"
                    ) {
                        status
                    }
                }
                ''', context_value=request_headers, backend=backend)

            assert executed['errors']
            assert executed['errors'][0]
            assert executed['errors'][0]['message'] == "Error, you do not have permission to remove organizations."
