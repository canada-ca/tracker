import pytest
from flask import Request
from graphene.test import Client
from unittest import TestCase
from werkzeug.test import create_environ
from app import app
from queries import schema
from backend.security_check import SecurityAnalysisBackend
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
    Ssl_scans,
)


@pytest.fixture(scope="class")
def domain_test_db_init():
    with app.app_context():
        test_read = Users(
            id=1,
            display_name="testuserread",
            user_name="testuserread@testemail.ca",
            password="testpassword123",
        )
        db_session.add(test_read)
        test_super_admin = Users(
            id=2,
            display_name="testsuperadmin",
            user_name="testsuperadmin@testemail.ca",
            password="testpassword123",
        )
        db_session.add(test_super_admin)
        test_admin = Users(
            id=3,
            display_name="testadmin",
            user_name="testadmin@testemail.ca",
            password="testpassword123",
        )
        db_session.add(test_admin)
        test_admin = Users(
            id=4,
            display_name="testadmin2",
            user_name="testadmin2@testemail.ca",
            password="testpassword123",
        )
        db_session.add(test_admin)
        test_write = Users(
            id=5,
            display_name="testuserwrite",
            user_name="testuserwrite@testemail.ca",
            password="testpassword123",
        )
        db_session.add(test_write)
        test_write2 = Users(
            id=6,
            display_name="testuserwrite2",
            user_name="testuserwrite2@testemail.ca",
            password="testpassword123",
        )
        db_session.add(test_write2)

        org = Organizations(id=1, acronym="ORG1")
        db_session.add(org)
        org = Organizations(id=2, acronym="ORG2")
        db_session.add(org)

        test_user_read_role = User_affiliations(
            user_id=1, organization_id=1, permission="user_read"
        )
        db_session.add(test_user_read_role)
        test_super_admin_role = User_affiliations(
            user_id=2, organization_id=2, permission="super_admin"
        )
        db_session.add(test_super_admin_role)
        test_admin_role = User_affiliations(
            user_id=3, organization_id=1, permission="admin"
        )
        db_session.add(test_admin_role)
        test_admin_role = User_affiliations(
            user_id=4, organization_id=2, permission="admin"
        )
        db_session.add(test_admin_role)
        test_user_write_role = User_affiliations(
            user_id=5, organization_id=1, permission="user_write"
        )
        db_session.add(test_user_write_role)
        test_user_write_role_2 = User_affiliations(
            user_id=6, organization_id=2, permission="user_write"
        )
        db_session.add(test_user_write_role_2)

        sa_update_domain = Domains(domain="sa.update.domain.ca", organization_id=1)
        db_session.add(sa_update_domain)
        sa_remove_domain = Domains(domain="sa.remove.domain.ca", organization_id=1)
        db_session.add(sa_remove_domain)
        org_admin_update_domain = Domains(
            domain="admin.update.domain.ca", organization_id=1
        )
        db_session.add(org_admin_update_domain)
        org_admin_domain = Domains(domain="admin.remove.domain.ca", organization_id=1)
        db_session.add(org_admin_domain)
        org_admin_update_domain2 = Domains(
            domain="admin2.update.domain.ca", organization_id=1
        )
        db_session.add(org_admin_update_domain2)
        org_admin_domain2 = Domains(domain="admin2.remove.domain.ca", organization_id=1)
        db_session.add(org_admin_domain2)
        user_write_update_domain = Domains(
            domain="user.write.update.domain.ca", organization_id=1
        )
        db_session.add(user_write_update_domain)
        user_write_domain = Domains(
            domain="user.write.remove.domain.ca", organization_id=1
        )
        db_session.add(user_write_domain)
        user_write_update_domain_2 = Domains(
            domain="user2.write.update.domain.ca", organization_id=1
        )
        db_session.add(user_write_update_domain_2)
        user_write_domain_2 = Domains(
            domain="user2.write.remove.domain.ca", organization_id=1
        )
        db_session.add(user_write_domain_2)
        user_read_update_domain = Domains(
            domain="user.read.update.domain.ca", organization_id=1
        )
        db_session.add(user_read_update_domain)
        user_read_domain = Domains(
            domain="user.read.remove.domain.ca", organization_id=1
        )
        db_session.add(user_read_domain)
        db_session.commit()

        # Super Admin Scans
        domain_id = (
            db_session.query(Domains)
            .filter(Domains.domain == "sa.remove.domain.ca")
            .first()
            .id
        )
        sa_scan = Scans(id=1, domain_id=domain_id)
        db_session.add(sa_scan)
        db_session.commit()
        sa_dkim = Dkim_scans(id=1)
        db_session.add(sa_dkim)
        sa_dmarc = Dmarc_scans(id=1)
        db_session.add(sa_dmarc)
        sa_https = Https_scans(id=1)
        db_session.add(sa_https)
        sa_ssl = Ssl_scans(id=1)
        db_session.add(sa_ssl)
        sa_spf = Spf_scans(id=1)
        db_session.add(sa_spf)
        db_session.commit()

        # Admin Scans
        domain_id = (
            db_session.query(Domains)
            .filter(Domains.domain == "admin.remove.domain.ca")
            .first()
            .id
        )
        admin_scan = Scans(id=2, domain_id=domain_id)
        db_session.add(admin_scan)
        db_session.commit()
        admin_dkim = Dkim_scans(id=2)
        db_session.add(admin_dkim)
        admin_dmarc = Dmarc_scans(id=2)
        db_session.add(admin_dmarc)
        admin_https = Https_scans(id=2)
        db_session.add(admin_https)
        admin_ssl = Ssl_scans(id=2)
        db_session.add(admin_ssl)
        admin_spf = Spf_scans(id=2)
        db_session.add(admin_spf)
        db_session.commit()

        # User Write Scans
        domain_id = (
            db_session.query(Domains)
            .filter(Domains.domain == "user.write.remove.domain.ca")
            .first()
            .id
        )
        user_w_scan = Scans(id=3, domain_id=domain_id)
        db_session.add(user_w_scan)
        db_session.commit()
        user_w_dkim = Dkim_scans(id=3)
        db_session.add(user_w_dkim)
        user_w_dmarc = Dmarc_scans(id=3)
        db_session.add(user_w_dmarc)
        user_w_https = Https_scans(id=3)
        db_session.add(user_w_https)
        user_w_ssl = Ssl_scans(id=3)
        db_session.add(user_w_ssl)
        user_w_spf = Spf_scans(id=3)
        db_session.add(user_w_spf)
        db_session.commit()

    yield

    with app.app_context():
        Ssl_scans.query.delete()
        Spf_scans.query.delete()
        Mx_scans.query.delete()
        Https_scans.query.delete()
        Dmarc_scans.query.delete()
        Dkim_scans.query.delete()
        Scans.query.delete()
        Domains.query.delete()
        User_affiliations.query.delete()
        Organizations.query.delete()
        Users.query.delete()
        db_session.commit()


@pytest.mark.usefixtures("domain_test_db_init")
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
                """
                mutation{
                    signIn(userName:"testsuperadmin@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                """,
                backend=backend,
            )
            assert get_token["data"]["signIn"]["authToken"] is not None
            token = get_token["data"]["signIn"]["authToken"]
            assert token is not None

            environ = create_environ()
            environ.update(HTTP_AUTHORIZATION=token)
            request_headers = Request(environ)
            executed = client.execute(
                """
                mutation{
                    createDomain(org: "ORG1", url: "sa.create.domain.ca") {
                        status
                    }
                }
                """,
                context_value=request_headers,
                backend=backend,
            )

            assert executed["data"]
            assert executed["data"]["createDomain"]
            assert executed["data"]["createDomain"]["status"]

            executed = client.execute(
                """
                {
                    domain(url: "sa.create.domain.ca") {
                        url
                    }
                }
                """,
                context_value=request_headers,
                backend=backend,
            )
            result_refr = {"data": {"domain": [{"url": "sa.create.domain.ca"}]}}
            self.assertDictEqual(result_refr, executed)

    def test_domain_modification_super_admin(self):
        """
        Test to see if super admins can modify domains
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                """
                mutation{
                    signIn(userName:"testsuperadmin@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                """,
                backend=backend,
            )
            assert get_token["data"]["signIn"]["authToken"] is not None
            token = get_token["data"]["signIn"]["authToken"]
            assert token is not None

            environ = create_environ()
            environ.update(HTTP_AUTHORIZATION=token)
            request_headers = Request(environ)
            executed = client.execute(
                """
                mutation{
                    updateDomain(
                        currentUrl: "sa.update.domain.ca",
                        updatedUrl: "updated.sa.update.domain.ca"
                    ) {
                        status
                    }
                }
                """,
                context_value=request_headers,
                backend=backend,
            )

            assert executed["data"]
            assert executed["data"]["updateDomain"]
            assert executed["data"]["updateDomain"]["status"]

            executed = client.execute(
                """
                {
                    domain(url: "updated.sa.update.domain.ca") {
                        url
                    }
                }
                """,
                context_value=request_headers,
                backend=backend,
            )
            result_refr = {"data": {"domain": [{"url": "updated.sa.update.domain.ca"}]}}
            self.assertDictEqual(result_refr, executed)

    def test_domain_removal_super_admin(self):
        """
        Test to see if super admins can remove domains
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                """
                mutation{
                    signIn(userName:"testsuperadmin@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                """,
                backend=backend,
            )
            assert get_token["data"]["signIn"]["authToken"] is not None
            token = get_token["data"]["signIn"]["authToken"]
            assert token is not None

            environ = create_environ()
            environ.update(HTTP_AUTHORIZATION=token)
            request_headers = Request(environ)
            executed = client.execute(
                """
                mutation{
                    removeDomain(url: "sa.remove.domain.ca") {
                        status
                    }
                }
                """,
                context_value=request_headers,
                backend=backend,
            )

            assert executed["data"]
            assert executed["data"]["removeDomain"]
            assert executed["data"]["removeDomain"]["status"]

            assert (
                not db_session.query(Domains)
                .filter(Domains.domain == "sa.remove.domain.ca")
                .all()
            )
            assert not db_session.query(Scans).filter(Scans.id == 1).all()
            assert not db_session.query(Dkim_scans).filter(Dkim_scans.id == 1).all()
            assert not db_session.query(Dmarc_scans).filter(Dmarc_scans.id == 1).all()
            assert not db_session.query(Https_scans).filter(Https_scans.id == 1).all()
            assert not db_session.query(Mx_scans).filter(Mx_scans.id == 1).all()
            assert not db_session.query(Ssl_scans).filter(Ssl_scans.id == 1).all()
            assert not db_session.query(Spf_scans).filter(Spf_scans.id == 1).all()

    def test_domain_creation_super_admin_acronym_sa(self):
        """
        Test to see if super admins cant create domain belonging to SA org
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                """
                mutation{
                    signIn(userName:"testsuperadmin@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                """,
                backend=backend,
            )
            assert get_token["data"]["signIn"]["authToken"] is not None
            token = get_token["data"]["signIn"]["authToken"]
            assert token is not None

            environ = create_environ()
            environ.update(HTTP_AUTHORIZATION=token)
            request_headers = Request(environ)
            executed = client.execute(
                """
                mutation{
                    createDomain(org: "SA", url: "sa.create.domain.ca") {
                        status
                    }
                }
                """,
                context_value=request_headers,
                backend=backend,
            )

            assert executed["errors"]
            assert executed["errors"][0]
            assert (
                executed["errors"][0]["message"]
                == "Error, you cannot add a domain to this organization."
            )

    # Org Admin Tests
    def test_domain_creation_org_admin(self):
        """
        Test to see if org admin can create domains
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                """
                mutation{
                    signIn(userName:"testadmin@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                """,
                backend=backend,
            )
            assert get_token["data"]["signIn"]["authToken"] is not None
            token = get_token["data"]["signIn"]["authToken"]
            assert token is not None

            environ = create_environ()
            environ.update(HTTP_AUTHORIZATION=token)
            request_headers = Request(environ)
            executed = client.execute(
                """
                mutation{
                    createDomain(org: "ORG1", url: "admin.create.domain.ca") {
                        status
                    }
                }
                """,
                context_value=request_headers,
                backend=backend,
            )

            assert executed["data"]
            assert executed["data"]["createDomain"]
            assert executed["data"]["createDomain"]["status"]

            executed = client.execute(
                """
                {
                    domain(url: "admin.create.domain.ca") {
                        url
                    }
                }
                """,
                context_value=request_headers,
                backend=backend,
            )
            result_refr = {"data": {"domain": [{"url": "admin.create.domain.ca"}]}}
            self.assertDictEqual(result_refr, executed)

    def test_domain_modification_org_admin(self):
        """
        Test to see if org admin can modify domains
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                """
                mutation{
                    signIn(userName:"testadmin@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                """,
                backend=backend,
            )
            assert get_token["data"]["signIn"]["authToken"] is not None
            token = get_token["data"]["signIn"]["authToken"]
            assert token is not None

            environ = create_environ()
            environ.update(HTTP_AUTHORIZATION=token)
            request_headers = Request(environ)
            executed = client.execute(
                """
                mutation{
                    updateDomain(
                        currentUrl: "admin.update.domain.ca",
                        updatedUrl: "updated.admin.update.domain.ca"
                    ) {
                        status
                    }
                }
                """,
                context_value=request_headers,
                backend=backend,
            )

            assert executed["data"]
            assert executed["data"]["updateDomain"]
            assert executed["data"]["updateDomain"]["status"]

            executed = client.execute(
                """
                {
                    domain(url: "updated.admin.update.domain.ca") {
                        url
                    }
                }
                """,
                context_value=request_headers,
                backend=backend,
            )
            result_refr = {
                "data": {"domain": [{"url": "updated.admin.update.domain.ca"}]}
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
                """
                mutation{
                    signIn(userName:"testadmin@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                """,
                backend=backend,
            )
            assert get_token["data"]["signIn"]["authToken"] is not None
            token = get_token["data"]["signIn"]["authToken"]
            assert token is not None

            environ = create_environ()
            environ.update(HTTP_AUTHORIZATION=token)
            request_headers = Request(environ)
            executed = client.execute(
                """
                mutation{
                    removeDomain(url: "admin.remove.domain.ca") {
                        status
                    }
                }
                """,
                context_value=request_headers,
                backend=backend,
            )

            assert executed["data"]
            assert executed["data"]["removeDomain"]
            assert executed["data"]["removeDomain"]["status"]

            assert (
                not db_session.query(Domains)
                .filter(Domains.domain == "admin.remove.domain.ca")
                .all()
            )
            assert not db_session.query(Scans).filter(Scans.id == 2).all()
            assert not db_session.query(Dkim_scans).filter(Dkim_scans.id == 2).all()
            assert not db_session.query(Dmarc_scans).filter(Dmarc_scans.id == 2).all()
            assert not db_session.query(Https_scans).filter(Https_scans.id == 2).all()
            assert not db_session.query(Mx_scans).filter(Mx_scans.id == 2).all()
            assert not db_session.query(Ssl_scans).filter(Ssl_scans.id == 2).all()
            assert not db_session.query(Spf_scans).filter(Spf_scans.id == 2).all()

    # Different Org Admin
    def test_domain_creation_diff_org_admin(self):
        """
        Test to see if org admin can create domains
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                """
                mutation{
                    signIn(userName:"testadmin2@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                """,
                backend=backend,
            )
            assert get_token["data"]["signIn"]["authToken"] is not None
            token = get_token["data"]["signIn"]["authToken"]
            assert token is not None

            environ = create_environ()
            environ.update(HTTP_AUTHORIZATION=token)
            request_headers = Request(environ)
            executed = client.execute(
                """
                mutation{
                    createDomain(org: "ORG1", url: "admin2.create.domain.ca") {
                        status
                    }
                }
                """,
                context_value=request_headers,
                backend=backend,
            )

            assert executed["errors"]
            assert executed["errors"][0]
            assert (
                executed["errors"][0]["message"]
                == "Error, you do not have permission to create a domain for that organization"
            )

    def test_domain_modification_diff_org_admin(self):
        """
        Test to see if org admin can modify domains
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                """
                mutation{
                    signIn(userName:"testadmin2@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                """,
                backend=backend,
            )
            assert get_token["data"]["signIn"]["authToken"] is not None
            token = get_token["data"]["signIn"]["authToken"]
            assert token is not None

            environ = create_environ()
            environ.update(HTTP_AUTHORIZATION=token)
            request_headers = Request(environ)
            executed = client.execute(
                """
                mutation{
                    updateDomain(
                        currentUrl: "admin2.update.domain.ca",
                        updatedUrl: "updated.admin.update.domain.ca"
                    ) {
                        status
                    }
                }
                """,
                context_value=request_headers,
                backend=backend,
            )

            assert executed["errors"]
            assert executed["errors"][0]
            assert (
                executed["errors"][0]["message"]
                == "Error, you do not have permission to edit domains belonging to another organization"
            )

    def test_domain_removal_diff_org_admin(self):
        """
        Test to see if org admins can remove domains
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                """
                mutation{
                    signIn(userName:"testadmin2@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                """,
                backend=backend,
            )
            assert get_token["data"]["signIn"]["authToken"] is not None
            token = get_token["data"]["signIn"]["authToken"]
            assert token is not None

            environ = create_environ()
            environ.update(HTTP_AUTHORIZATION=token)
            request_headers = Request(environ)
            executed = client.execute(
                """
                mutation{
                    removeDomain(url: "admin2.remove.domain.ca") {
                        status
                    }
                }
                """,
                context_value=request_headers,
                backend=backend,
            )

            assert executed["errors"]
            assert executed["errors"][0]
            assert (
                executed["errors"][0]["message"]
                == "Error, you do not have permission to remove domains."
            )

    # User Write Tests
    def test_domain_creation_user_write(self):
        """
        Test to see if org user write can create domains
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                """
                mutation{
                    signIn(userName:"testuserwrite@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                """,
                backend=backend,
            )
            assert get_token["data"]["signIn"]["authToken"] is not None
            token = get_token["data"]["signIn"]["authToken"]
            assert token is not None

            environ = create_environ()
            environ.update(HTTP_AUTHORIZATION=token)
            request_headers = Request(environ)
            executed = client.execute(
                """
                mutation{
                    createDomain(org: "ORG1", url: "user.write.create.domain.ca") {
                        status
                    }
                }
                """,
                context_value=request_headers,
                backend=backend,
            )

            assert executed["data"]
            assert executed["data"]["createDomain"]
            assert executed["data"]["createDomain"]["status"]

            executed = client.execute(
                """
                {
                    domain(url: "user.write.create.domain.ca") {
                        url
                    }
                }
                """,
                context_value=request_headers,
                backend=backend,
            )
            result_refr = {"data": {"domain": [{"url": "user.write.create.domain.ca"}]}}
            self.assertDictEqual(result_refr, executed)

    def test_domain_modification_user_write(self):
        """
        Test to see if user write can modify domains
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                """
                mutation{
                    signIn(userName:"testuserwrite@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                """,
                backend=backend,
            )
            assert get_token["data"]["signIn"]["authToken"] is not None
            token = get_token["data"]["signIn"]["authToken"]
            assert token is not None

            environ = create_environ()
            environ.update(HTTP_AUTHORIZATION=token)
            request_headers = Request(environ)
            executed = client.execute(
                """
                mutation{
                    updateDomain(
                        currentUrl: "user.write.update.domain.ca",
                        updatedUrl: "updated.user.write.update.domain.ca"
                    ) {
                        status
                    }
                }
                """,
                context_value=request_headers,
                backend=backend,
            )

            assert executed["data"]
            assert executed["data"]["updateDomain"]
            assert executed["data"]["updateDomain"]["status"]

            executed = client.execute(
                """
                {
                    domain(url: "updated.user.write.update.domain.ca") {
                        url
                    }
                }
                """,
                context_value=request_headers,
                backend=backend,
            )
            result_refr = {
                "data": {"domain": [{"url": "updated.user.write.update.domain.ca"}]}
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
                """
                mutation{
                    signIn(userName:"testuserwrite@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                """,
                backend=backend,
            )
            assert get_token["data"]["signIn"]["authToken"] is not None
            token = get_token["data"]["signIn"]["authToken"]
            assert token is not None

            environ = create_environ()
            environ.update(HTTP_AUTHORIZATION=token)
            request_headers = Request(environ)
            executed = client.execute(
                """
                mutation{
                    removeDomain(url: "user.write.remove.domain.ca") {
                        status
                    }
                }
                """,
                context_value=request_headers,
                backend=backend,
            )

            assert executed["data"]
            assert executed["data"]["removeDomain"]
            assert executed["data"]["removeDomain"]["status"]

            executed = client.execute(
                """
                {
                    domain(url: "user.write.remove.domain.ca") {
                        url
                    }
                }
                """,
                context_value=request_headers,
                backend=backend,
            )

            assert executed["errors"]
            assert executed["errors"][0]
            assert executed["errors"][0]["message"] == "Error, domain does not exist"

            assert (
                not db_session.query(Domains)
                .filter(Domains.domain == "user.write.remove.domain.ca")
                .all()
            )
            assert not db_session.query(Scans).filter(Scans.id == 3).all()
            assert not db_session.query(Dkim_scans).filter(Dkim_scans.id == 3).all()
            assert not db_session.query(Dmarc_scans).filter(Dmarc_scans.id == 3).all()
            assert not db_session.query(Https_scans).filter(Https_scans.id == 3).all()
            assert not db_session.query(Mx_scans).filter(Mx_scans.id == 3).all()
            assert not db_session.query(Ssl_scans).filter(Ssl_scans.id == 3).all()
            assert not db_session.query(Spf_scans).filter(Spf_scans.id == 3).all()

    # Different Org User Write
    def test_domain_creation_diff_org_user_write(self):
        """
        Test to see if user write from different org can create domain
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                """
                mutation{
                    signIn(userName:"testuserwrite2@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                """,
                backend=backend,
            )
            assert get_token["data"]["signIn"]["authToken"] is not None
            token = get_token["data"]["signIn"]["authToken"]
            assert token is not None

            environ = create_environ()
            environ.update(HTTP_AUTHORIZATION=token)
            request_headers = Request(environ)
            executed = client.execute(
                """
                mutation{
                    createDomain(org: "ORG1", url: "admin2.create.domain.ca") {
                        status
                    }
                }
                """,
                context_value=request_headers,
                backend=backend,
            )

            assert executed["errors"]
            assert executed["errors"][0]
            assert (
                executed["errors"][0]["message"]
                == "Error, you do not have permission to create a domain for that organization"
            )

    def test_domain_modification_diff_org_user_write(self):
        """
        Test to see if user write from different org can update domain
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                """
                mutation{
                    signIn(userName:"testuserwrite2@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                """,
                backend=backend,
            )
            assert get_token["data"]["signIn"]["authToken"] is not None
            token = get_token["data"]["signIn"]["authToken"]
            assert token is not None

            environ = create_environ()
            environ.update(HTTP_AUTHORIZATION=token)
            request_headers = Request(environ)
            executed = client.execute(
                """
                mutation{
                    updateDomain(
                        currentUrl: "user2.write.update.domain.ca",
                        updatedUrl: "updated.user.write.update.domain.ca"
                    ) {
                        status
                    }
                }
                """,
                context_value=request_headers,
                backend=backend,
            )

            assert executed["errors"]
            assert executed["errors"][0]
            assert (
                executed["errors"][0]["message"]
                == "Error, you do not have permission to edit domains belonging to another organization"
            )

    def test_domain_removal_diff_org_user_write(self):
        """
        Test to see if user write from different org can remove domain
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                """
                mutation{
                    signIn(userName:"testuserwrite2@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                """,
                backend=backend,
            )
            assert get_token["data"]["signIn"]["authToken"] is not None
            token = get_token["data"]["signIn"]["authToken"]
            assert token is not None

            environ = create_environ()
            environ.update(HTTP_AUTHORIZATION=token)
            request_headers = Request(environ)
            executed = client.execute(
                """
                mutation{
                    removeDomain(url: "user2.write.remove.domain.ca") {
                        status
                    }
                }
                """,
                context_value=request_headers,
                backend=backend,
            )

            assert executed["errors"]
            assert executed["errors"][0]
            assert (
                executed["errors"][0]["message"]
                == "Error, you do not have permission to remove domains."
            )

    # Different Org User Read
    def test_domain_creation_org_user_read(self):
        """
        Test to see if user read can create domain
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                """
                mutation{
                    signIn(userName:"testuserread@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                """,
                backend=backend,
            )
            assert get_token["data"]["signIn"]["authToken"] is not None
            token = get_token["data"]["signIn"]["authToken"]
            assert token is not None

            environ = create_environ()
            environ.update(HTTP_AUTHORIZATION=token)
            request_headers = Request(environ)
            executed = client.execute(
                """
                mutation{
                    createDomain(org: "ORG1", url: "user.read.create.domain.ca") {
                        status
                    }
                }
                """,
                context_value=request_headers,
                backend=backend,
            )

            assert executed["errors"]
            assert executed["errors"][0]
            assert (
                executed["errors"][0]["message"]
                == "Error, you do not have permission to create a domain for that organization"
            )

    def test_domain_modification_org_user_read(self):
        """
        Test to see if user read can modify domain
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                """
                mutation{
                    signIn(userName:"testuserread@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                """,
                backend=backend,
            )
            assert get_token["data"]["signIn"]["authToken"] is not None
            token = get_token["data"]["signIn"]["authToken"]
            assert token is not None

            environ = create_environ()
            environ.update(HTTP_AUTHORIZATION=token)
            request_headers = Request(environ)
            executed = client.execute(
                """
                mutation{
                    updateDomain(
                        currentUrl: "user.read.update.domain.ca",
                        updatedUrl: "updated.user.read.update.domain.ca"
                    ) {
                        status
                    }
                }
                """,
                context_value=request_headers,
                backend=backend,
            )

            assert executed["errors"]
            assert executed["errors"][0]
            assert (
                executed["errors"][0]["message"]
                == "Error, you do not have permission to edit domains belonging to another organization"
            )

    def test_domain_removal_org_user_read(self):
        """
        Test to see if user read can remove domain
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                """
                mutation{
                    signIn(userName:"testuserread@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                """,
                backend=backend,
            )
            assert get_token["data"]["signIn"]["authToken"] is not None
            token = get_token["data"]["signIn"]["authToken"]
            assert token is not None

            environ = create_environ()
            environ.update(HTTP_AUTHORIZATION=token)
            request_headers = Request(environ)
            executed = client.execute(
                """
                mutation{
                    removeDomain(url: "user.read.remove.domain.ca") {
                        status
                    }
                }
                """,
                context_value=request_headers,
                backend=backend,
            )

            assert executed["errors"]
            assert executed["errors"][0]
            assert (
                executed["errors"][0]["message"]
                == "Error, you do not have permission to remove domains."
            )
