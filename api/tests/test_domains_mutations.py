import sys
import os
from os.path import dirname, join, expanduser, normpath, realpath

import pytest
from flask import Request
from graphene.test import Client
from flask_bcrypt import Bcrypt

from unittest import TestCase

from werkzeug.test import create_environ

from app import app
from db import db
from models import Organizations, Domains, Users, User_affiliations
from queries import schema
from backend.security_check import SecurityAnalysisBackend

# This is the only way I could get imports to work for unit testing.
PACKAGE_PARENT = '..'
SCRIPT_DIR = dirname(realpath(join(os.getcwd(), expanduser(__file__))))
sys.path.append(normpath(join(SCRIPT_DIR, PACKAGE_PARENT)))


@pytest.fixture(scope='class')
def domain_test_db_init():
    db.init_app(app)
    bcrypt = Bcrypt(app)

    with app.app_context():
        test_read = Users(
            id=1,
            display_name="testuserread",
            user_name="testuserread@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123").decode("UTF-8"),
        )
        db.session.add(test_read)
        test_super_admin = Users(
            id=2,
            display_name="testsuperadmin",
            user_name="testsuperadmin@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123").decode("UTF-8")
        )
        db.session.add(test_super_admin)
        test_admin = Users(
            id=3,
            display_name="testadmin",
            user_name="testadmin@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123").decode("UTF-8")
        )
        db.session.add(test_admin)
        test_admin = Users(
            id=4,
            display_name="testadmin2",
            user_name="testadmin2@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123").decode("UTF-8")
        )
        db.session.add(test_admin)
        test_write = Users(
            id=5,
            display_name="testuserwrite",
            user_name="testuserwrite@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123").decode("UTF-8")
        )
        db.session.add(test_write)
        test_write2 = Users(
            id=6,
            display_name="testuserwrite2",
            user_name="testuserwrite2@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123").decode("UTF-8")
        )
        db.session.add(test_write2)

        org = Organizations(
            id=1,
            acronym='ORG1'
        )
        db.session.add(org)
        org = Organizations(
            id=2,
            acronym='ORG2'
        )
        db.session.add(org)

        test_user_read_role = User_affiliations(
            user_id=1,
            organization_id=1,
            permission='user_read'
        )
        db.session.add(test_user_read_role)
        test_super_admin_role = User_affiliations(
            user_id=2,
            organization_id=2,
            permission='super_admin'
        )
        db.session.add(test_super_admin_role)
        test_admin_role = User_affiliations(
            user_id=3,
            organization_id=1,
            permission='admin'
        )
        db.session.add(test_admin_role)
        test_admin_role = User_affiliations(
            user_id=4,
            organization_id=2,
            permission='admin'
        )
        db.session.add(test_admin_role)
        test_user_write_role = User_affiliations(
            user_id=5,
            organization_id=1,
            permission='user_write'
        )
        db.session.add(test_user_write_role)
        test_user_write_role_2 = User_affiliations(
            user_id=6,
            organization_id=2,
            permission='user_write'
        )
        db.session.add(test_user_write_role_2)

        sa_update_domain = Domains(
            domain="sa.update.domain.ca",
            organization_id=1
        )
        db.session.add(sa_update_domain)
        sa_remove_domain = Domains(
            domain="sa.remove.domain.ca",
            organization_id=1
        )
        db.session.add(sa_remove_domain)
        org_admin_update_domain = Domains(
            domain="admin.update.domain.ca",
            organization_id=1
        )
        db.session.add(org_admin_update_domain)
        org_admin_domain = Domains(
            domain="admin.remove.domain.ca",
            organization_id=1
        )
        db.session.add(org_admin_domain)
        org_admin_update_domain2 = Domains(
            domain="admin2.update.domain.ca",
            organization_id=1
        )
        db.session.add(org_admin_update_domain2)
        org_admin_domain2 = Domains(
            domain="admin2.remove.domain.ca",
            organization_id=1
        )
        db.session.add(org_admin_domain2)
        user_write_update_domain = Domains(
            domain="user.write.update.domain.ca",
            organization_id=1
        )
        db.session.add(user_write_update_domain)
        user_write_domain = Domains(
            domain="user.write.remove.domain.ca",
            organization_id=1
        )
        db.session.add(user_write_domain)
        user_write_update_domain_2 = Domains(
            domain="user2.write.update.domain.ca",
            organization_id=1
        )
        db.session.add(user_write_update_domain_2)
        user_write_domain_2 = Domains(
            domain="user2.write.remove.domain.ca",
            organization_id=1
        )
        db.session.add(user_write_domain_2)
        db.session.commit()

    yield

    with app.app_context():
        Domains.query.delete()
        User_affiliations.query.delete()
        Organizations.query.delete()
        Users.query.delete()
        db.session.commit()


@pytest.mark.usefixtures('domain_test_db_init')
class TestDomainMutationAccessControl(TestCase):
    # Super Admin Tests
    def test_domain_creation_super_admin(self):
        """
        Test to see if super admins can create domains
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
                mutation{
                    createDomain(org: "ORG1", url: "sa.create.domain.ca") {
                        status
                    }
                }
                ''', context_value=request_headers, backend=backend)

            assert executed['data']
            assert executed['data']['createDomain']
            assert executed['data']['createDomain']['status']

            executed = client.execute(
                '''
                {
                    domain(url: "sa.create.domain.ca") {
                        edges {
                            node {
                                url
                            }
                        }
                    }
                }
                ''', context_value=request_headers, backend=backend)
            result_refr = {
                "data": {
                    "domain": {
                        "edges": [
                            {
                                "node": {
                                    "url": "somecooldomain.ca"
                                }
                            }
                        ]
                    }
                }
            }
            self.assertDictEqual(result_refr, executed)

    def test_domain_modification_super_admin(self):
        """
        Test to see if super admins can modify domains
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
                mutation{
                    updateDomain(
                        currentUrl: "sa.update.domain.ca",
                        updatedUrl: "updated.sa.update.domain.ca"
                    ) {
                        status
                    }
                }
                ''', context_value=request_headers, backend=backend)

            assert executed['data']
            assert executed['data']['updateDomain']
            assert executed['data']['updateDomain']['status']

            executed = client.execute(
                '''
                {
                    domain(url: "updated.sa.update.domain.ca") {
                        edges {
                            node {
                                url
                            }
                        }
                    }
                }
                ''', context_value=request_headers, backend=backend)
            result_refr = {
                "data": {
                    "domain": {
                        "edges": [
                            {
                                "node": {
                                    "url": "updated.sa.update.domain.ca"
                                }
                            }
                        ]
                    }
                }
            }
            self.assertDictEqual(result_refr, executed)

    def test_domain_removal_super_admin(self):
        """
        Test to see if super admins can remove domains
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
                mutation{
                    removeDomain(url: "sa.remove.domain.ca") {
                        status
                    }
                }
                ''', context_value=request_headers, backend=backend)

            assert executed['data']
            assert executed['data']['removeDomain']
            assert executed['data']['removeDomain']['status']

            executed = client.execute(
                '''
                {
                    domain(url: "sa.remove.domain.ca") {
                        edges {
                            node {
                                url
                            }
                        }
                    }
                }
                ''', context_value=request_headers, backend=backend)

            assert executed['errors']
            assert executed['errors'][0]
            assert executed['errors'][0]['message'] == "Error, domain does not exist"

    # Org Admin Tests
    def test_domain_creation_org_admin(self):
        """
        Test to see if org admin can create domains
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
                mutation{
                    createDomain(org: "ORG1", url: "admin.create.domain.ca") {
                        status
                    }
                }
                ''', context_value=request_headers, backend=backend)

            assert executed['data']
            assert executed['data']['createDomain']
            assert executed['data']['createDomain']['status']

            executed = client.execute(
                '''
                {
                    domain(url: "admin.create.domain.ca") {
                        edges {
                            node {
                                url
                            }
                        }
                    }
                }
                ''', context_value=request_headers, backend=backend)
            result_refr = {
                "data": {
                    "domain": {
                        "edges": [
                            {
                                "node": {
                                    "url": "admin.create.domain.ca"
                                }
                            }
                        ]
                    }
                }
            }
            self.assertDictEqual(result_refr, executed)

    def test_domain_modification_org_admin(self):
        """
        Test to see if org admin can modify domains
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
                mutation{
                    updateDomain(
                        currentUrl: "admin.update.domain.ca",
                        updatedUrl: "updated.admin.update.domain.ca"
                    ) {
                        status
                    }
                }
                ''', context_value=request_headers, backend=backend)

            assert executed['data']
            assert executed['data']['updateDomain']
            assert executed['data']['updateDomain']['status']

            executed = client.execute(
                '''
                {
                    domain(url: "updated.admin.update.domain.ca") {
                        edges {
                            node {
                                url
                            }
                        }
                    }
                }
                ''', context_value=request_headers, backend=backend)
            result_refr = {
                "data": {
                    "domain": {
                        "edges": [
                            {
                                "node": {
                                    "url": "updatedadminupdatedomain.ca"
                                }
                            }
                        ]
                    }
                }
            }
            self.assertDictEqual(result_refr, executed)

    def test_domain_removal_org_admin(self):
        """
        Test to see if org admins can remove domains
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
                mutation{
                    removeDomain(url: "admin.remove.domain.ca") {
                        status
                    }
                }
                ''', context_value=request_headers, backend=backend)

            assert executed['data']
            assert executed['data']['removeDomain']
            assert executed['data']['removeDomain']['status']

            executed = client.execute(
                '''
                {
                    domain(url: "admin.remove.domain.ca") {
                        edges {
                            node {
                                url
                            }
                        }
                    }
                }
                ''', context_value=request_headers, backend=backend)

            assert executed['errors']
            assert executed['errors'][0]
            assert executed['errors'][0]['message'] == "Error, domain does not exist"

    # Different Org Admin
    def test_domain_creation_diff_org_admin(self):
        """
        Test to see if org admin can create domains
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                '''
                mutation{
                    signIn(userName:"testadmin2@testemail.ca", password:"testpassword123"){
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
                mutation{
                    createDomain(org: "ORG1", url: "admin2.create.domain.ca") {
                        status
                    }
                }
                ''', context_value=request_headers, backend=backend)

            assert executed['errors']
            assert executed['errors'][0]
            assert executed['errors'][0]['message'] == "Error, you do not have permission to create a domain for that organization"

    def test_domain_modification_diff_org_admin(self):
        """
        Test to see if org admin can modify domains
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                '''
                mutation{
                    signIn(userName:"testadmin2@testemail.ca", password:"testpassword123"){
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
                mutation{
                    updateDomain(
                        currentUrl: "admin2.update.domain.ca",
                        updatedUrl: "updated.admin.update.domain.ca"
                    ) {
                        status
                    }
                }
                ''', context_value=request_headers, backend=backend)

            assert executed['errors']
            assert executed['errors'][0]
            assert executed['errors'][0]['message'] == "Error, you do not have permission to edit domains belonging to another organization"

    def test_domain_removal_diff_org_admin(self):
        """
        Test to see if org admins can remove domains
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                '''
                mutation{
                    signIn(userName:"testadmin2@testemail.ca", password:"testpassword123"){
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
                mutation{
                    removeDomain(url: "admin2.remove.domain.ca") {
                        status
                    }
                }
                ''', context_value=request_headers, backend=backend)

            assert executed['errors']
            assert executed['errors'][0]
            assert executed['errors'][0]['message'] == "Error, you do not have permission to create a domain for that organization"

    # User Write Tests
    def test_domain_creation_user_write(self):
        """
        Test to see if org user write can create domains
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
                mutation{
                    createDomain(org: "ORG1", url: "user.write.create.domain.ca") {
                        status
                    }
                }
                ''', context_value=request_headers, backend=backend)

            assert executed['data']
            assert executed['data']['createDomain']
            assert executed['data']['createDomain']['status']

            executed = client.execute(
                '''
                {
                    domain(url: "user.write.create.domain.ca") {
                        edges {
                            node {
                                url
                            }
                        }
                    }
                }
                ''', context_value=request_headers, backend=backend)
            result_refr = {
                "data": {
                    "domain": {
                        "edges": [
                            {
                                "node": {
                                    "url": "user.write.create.domain.ca"
                                }
                            }
                        ]
                    }
                }
            }
            self.assertDictEqual(result_refr, executed)

    def test_domain_modification_user_write(self):
        """
        Test to see if user write can modify domains
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
                mutation{
                    updateDomain(
                        currentUrl: "user.write.update.domain.ca",
                        updatedUrl: "updated.user.write.update.domain.ca"
                    ) {
                        status
                    }
                }
                ''', context_value=request_headers, backend=backend)

            assert executed['data']
            assert executed['data']['updateDomain']
            assert executed['data']['updateDomain']['status']

            executed = client.execute(
                '''
                {
                    domain(url: "updated.user.write.update.domain.ca") {
                        edges {
                            node {
                                url
                            }
                        }
                    }
                }
                ''', context_value=request_headers, backend=backend)
            result_refr = {
                "data": {
                    "domain": {
                        "edges": [
                            {
                                "node": {
                                    "url": "updatedadminupdatedomain.ca"
                                }
                            }
                        ]
                    }
                }
            }
            self.assertDictEqual(result_refr, executed)

    def test_domain_removal_user_write(self):
        """
        Test to see if user write can remove domains
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
                mutation{
                    removeDomain(url: "user.write.remove.domain.ca") {
                        status
                    }
                }
                ''', context_value=request_headers, backend=backend)

            assert executed['data']
            assert executed['data']['removeDomain']
            assert executed['data']['removeDomain']['status']

            executed = client.execute(
                '''
                {
                    domain(url: "user.write.remove.domain.ca") {
                        edges {
                            node {
                                url
                            }
                        }
                    }
                }
                ''', context_value=request_headers, backend=backend)

            assert executed['errors']
            assert executed['errors'][0]
            assert executed['errors'][0]['message'] == "Error, domain does not exist"

    # Different Org User Write
    def test_domain_creation_diff_org_user_write(self):
        """
        Test to see if user write from different org can create domain
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                '''
                mutation{
                    signIn(userName:"testuserwrite2@testemail.ca", password:"testpassword123"){
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
                mutation{
                    createDomain(org: "ORG1", url: "admin2.create.domain.ca") {
                        status
                    }
                }
                ''', context_value=request_headers, backend=backend)

            assert executed['errors']
            assert executed['errors'][0]
            assert executed['errors'][0]['message'] == "Error, you do not have permission to create a domain for that organization"

    def test_domain_modification_diff_org_user_write(self):
        """
        Test to see if user write from different org can update domain
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                '''
                mutation{
                    signIn(userName:"testuserwrite2@testemail.ca", password:"testpassword123"){
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
                mutation{
                    updateDomain(
                        currentUrl: "user2.write.update.domain.ca",
                        updatedUrl: "updated.user.write.update.domain.ca"
                    ) {
                        status
                    }
                }
                ''', context_value=request_headers, backend=backend)

            assert executed['errors']
            assert executed['errors'][0]
            assert executed['errors'][0]['message'] == "Error, you do not have permission to edit domains belonging to another organization"

    def test_domain_removal_diff_org_user_write(self):
        """
        Test to see if user write from different org can remove domain
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                '''
                mutation{
                    signIn(userName:"testuserwrite2@testemail.ca", password:"testpassword123"){
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
                mutation{
                    removeDomain(url: "user2.write.remove.domain.ca") {
                        status
                    }
                }
                ''', context_value=request_headers, backend=backend)

            assert executed['errors']
            assert executed['errors'][0]
            assert executed['errors'][0]['message'] == "Error, you do not have permission to create a domain for that organization"
