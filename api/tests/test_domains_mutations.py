import pytest
from flask import Request
from graphene.test import Client
from unittest import TestCase
from werkzeug.test import create_environ
from app import app
from queries import schema
from backend.security_check import SecurityAnalysisBackend
from db import DB
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

save, cleanup, session = DB()


@pytest.fixture(scope="function")
def domain_test_db_init():
    with app.app_context():
        org1 = Organizations(acronym="ORG1", name="Organization 1")
        org2 = Organizations(acronym="ORG2", name="Organization 2")
        save(org1)
        save(org2)

        test_read = Users(
            display_name="testuserread",
            user_name="testuserread@testemail.ca",
            password="testpassword123",
            user_affiliation=[
                User_affiliations(user_organization=org1, permission="user_read")
            ],
        )
        save(test_read)
        test_super_admin = Users(
            display_name="testsuperadmin",
            user_name="testsuperadmin@testemail.ca",
            password="testpassword123",
            user_affiliation=[
                User_affiliations(user_organization=org2, permission="super_admin")
            ],
        )
        save(test_super_admin)
        test_admin = Users(
            display_name="testadmin",
            user_name="testadmin@testemail.ca",
            password="testpassword123",
            user_affiliation=[
                User_affiliations(user_organization=org1, permission="admin")
            ],
        )
        save(test_admin)
        test_admin2 = Users(
            display_name="testadmin2",
            user_name="testadmin2@testemail.ca",
            password="testpassword123",
            user_affiliation=[
                User_affiliations(user_organization=org2, permission="admin")
            ],
        )
        save(test_admin2)
        test_write = Users(
            display_name="testuserwrite",
            user_name="testuserwrite@testemail.ca",
            password="testpassword123",
            user_affiliation=[
                User_affiliations(user_organization=org1, permission="user_write")
            ],
        )
        save(test_write)
        test_write2 = Users(
            display_name="testuserwrite2",
            user_name="testuserwrite2@testemail.ca",
            password="testpassword123",
            user_affiliation=[
                User_affiliations(user_organization=org2, permission="user_write")
            ],
        )
        save(test_write2)

        sa_update_domain = Domains(
            domain="sa.update.domain.ca", organization_id=org1.id
        )
        session.add(sa_update_domain)
        sa_remove_domain = Domains(
            domain="sa.remove.domain.ca", organization_id=org1.id
        )
        session.add(sa_remove_domain)
        org_admin_update_domain = Domains(
            domain="admin.update.domain.ca", organization_id=org1.id
        )
        session.add(org_admin_update_domain)
        org_admin_domain = Domains(
            domain="admin.remove.domain.ca", organization_id=org1.id
        )
        session.add(org_admin_domain)
        org_admin_update_domain2 = Domains(
            domain="admin2.update.domain.ca", organization_id=org1.id
        )
        session.add(org_admin_update_domain2)
        org_admin_domain2 = Domains(
            domain="admin2.remove.domain.ca", organization_id=org1.id
        )
        session.add(org_admin_domain2)
        user_write_update_domain = Domains(
            domain="user.write.update.domain.ca", organization_id=org1.id
        )
        session.add(user_write_update_domain)
        user_write_domain = Domains(
            domain="user.write.remove.domain.ca", organization_id=org1.id
        )
        session.add(user_write_domain)
        user_write_update_domain_2 = Domains(
            domain="user2.write.update.domain.ca", organization_id=org1.id
        )
        session.add(user_write_update_domain_2)
        user_write_domain_2 = Domains(
            domain="user2.write.remove.domain.ca", organization_id=org1.id
        )
        session.add(user_write_domain_2)
        user_read_update_domain = Domains(
            domain="user.read.update.domain.ca", organization_id=org1.id
        )
        session.add(user_read_update_domain)
        user_read_domain = Domains(
            domain="user.read.remove.domain.ca", organization_id=org1.id
        )
        session.add(user_read_domain)
        session.commit()

        # Super Admin Scans
        domain_id = (
            session.query(Domains)
            .filter(Domains.domain == "sa.remove.domain.ca")
            .first()
            .id
        )
        sa_scan = Scans(domain_id=domain_id)
        save(sa_scan)
        sa_dkim = Dkim_scans(id=sa_scan.id)
        session.add(sa_dkim)
        sa_dmarc = Dmarc_scans(id=sa_scan.id)
        session.add(sa_dmarc)
        sa_https = Https_scans(id=sa_scan.id)
        session.add(sa_https)
        sa_ssl = Ssl_scans(id=sa_scan.id)
        session.add(sa_ssl)
        sa_spf = Spf_scans(id=sa_scan.id)
        session.add(sa_spf)
        session.commit()

        # Admin Scans
        domain_id = (
            session.query(Domains)
            .filter(Domains.domain == "admin.remove.domain.ca")
            .first()
            .id
        )
        admin_scan = Scans(domain_id=domain_id)
        session.add(admin_scan)
        session.commit()
        admin_dkim = Dkim_scans(id=admin_scan.id)
        session.add(admin_dkim)
        admin_dmarc = Dmarc_scans(id=admin_scan.id)
        session.add(admin_dmarc)
        admin_https = Https_scans(id=admin_scan.id)
        session.add(admin_https)
        admin_ssl = Ssl_scans(id=admin_scan.id)
        session.add(admin_ssl)
        admin_spf = Spf_scans(id=admin_scan.id)
        session.add(admin_spf)
        session.commit()

        # User Write Scans
        domain_id = (
            session.query(Domains)
            .filter(Domains.domain == "user.write.remove.domain.ca")
            .first()
            .id
        )
        user_w_scan = Scans(domain_id=domain_id)
        session.add(user_w_scan)
        session.commit()
        user_w_dkim = Dkim_scans(id=user_w_scan.id)
        session.add(user_w_dkim)
        user_w_dmarc = Dmarc_scans(id=user_w_scan.id)
        session.add(user_w_dmarc)
        user_w_https = Https_scans(id=user_w_scan.id)
        session.add(user_w_https)
        user_w_ssl = Ssl_scans(id=user_w_scan.id)
        session.add(user_w_ssl)
        user_w_spf = Spf_scans(id=user_w_scan.id)
        session.add(user_w_spf)
        session.commit()

        yield
        cleanup()


@pytest.mark.usefixtures("domain_test_db_init")
def test_domain_creation_super_admin():
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
                createDomain(orgSlug: "organization-1", url: "sa.create.domain.ca") {
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
                domain(urlSlug: "sa-create-domain-ca") {
                    url
                }
            }
            """,
            context_value=request_headers,
            backend=backend,
        )
        result_refr = {"data": {"domain": [{"url": "sa.create.domain.ca"}]}}
        assert result_refr == executed


@pytest.mark.usefixtures("domain_test_db_init")
def test_domain_modification_super_admin():
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
                domain(urlSlug: "updated-sa-update-domain-ca") {
                    url
                }
            }
            """,
            context_value=request_headers,
            backend=backend,
        )
        result_refr = {"data": {"domain": [{"url": "updated.sa.update.domain.ca"}]}}
        assert result_refr == executed


@pytest.mark.usefixtures("domain_test_db_init")
def test_domain_removal_super_admin():
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
            not session.query(Domains)
            .filter(Domains.domain == "sa.remove.domain.ca")
            .all()
        )
        assert not session.query(Scans).filter(Scans.id == 1).all()
        assert not session.query(Dkim_scans).filter(Dkim_scans.id == 1).all()
        assert not session.query(Dmarc_scans).filter(Dmarc_scans.id == 1).all()
        assert not session.query(Https_scans).filter(Https_scans.id == 1).all()
        assert not session.query(Mx_scans).filter(Mx_scans.id == 1).all()
        assert not session.query(Ssl_scans).filter(Ssl_scans.id == 1).all()
        assert not session.query(Spf_scans).filter(Spf_scans.id == 1).all()


@pytest.mark.usefixtures("domain_test_db_init")
def test_domain_creation_super_admin_acronym_sa():
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
                createDomain(orgSlug: "super-admin", url: "sa.create.domain.ca") {
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
@pytest.mark.usefixtures("domain_test_db_init")
def test_domain_creation_org_admin():
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
                createDomain(orgSlug: "organization-1", url: "admin.create.domain.ca") {
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
                domain(urlSlug: "admin-create-domain-ca") {
                    url
                }
            }
            """,
            context_value=request_headers,
            backend=backend,
        )
        result_refr = {"data": {"domain": [{"url": "admin.create.domain.ca"}]}}
        assert result_refr == executed


@pytest.mark.usefixtures("domain_test_db_init")
def test_domain_modification_org_admin():
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
                domain(urlSlug: "updated-admin-update-domain-ca") {
                    url
                }
            }
            """,
            context_value=request_headers,
            backend=backend,
        )
        result_refr = {"data": {"domain": [{"url": "updated.admin.update.domain.ca"}]}}
        assert result_refr == executed


@pytest.mark.usefixtures("domain_test_db_init")
def test_domain_removal_org_admin():
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
            not session.query(Domains)
            .filter(Domains.domain == "admin.remove.domain.ca")
            .all()
        )
        assert not session.query(Scans).filter(Scans.id == 2).all()
        assert not session.query(Dkim_scans).filter(Dkim_scans.id == 2).all()
        assert not session.query(Dmarc_scans).filter(Dmarc_scans.id == 2).all()
        assert not session.query(Https_scans).filter(Https_scans.id == 2).all()
        assert not session.query(Mx_scans).filter(Mx_scans.id == 2).all()
        assert not session.query(Ssl_scans).filter(Ssl_scans.id == 2).all()
        assert not session.query(Spf_scans).filter(Spf_scans.id == 2).all()


@pytest.mark.usefixtures("domain_test_db_init")
def test_domain_creation_diff_org_admin():
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
                createDomain(orgSlug: "organization-1", url: "admin2.create.domain.ca") {
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


@pytest.mark.usefixtures("domain_test_db_init")
def test_domain_modification_diff_org_admin():
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


@pytest.mark.usefixtures("domain_test_db_init")
def test_domain_removal_diff_org_admin():
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


@pytest.mark.usefixtures("domain_test_db_init")
def test_domain_creation_user_write():
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
                createDomain(orgSlug: "organization-1", url: "user.write.create.domain.ca") {
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
                domain(urlSlug: "user-write-create-domain-ca") {
                    url
                }
            }
            """,
            context_value=request_headers,
            backend=backend,
        )
        result_refr = {"data": {"domain": [{"url": "user.write.create.domain.ca"}]}}
        assert result_refr == executed


@pytest.mark.usefixtures("domain_test_db_init")
def test_domain_modification_user_write():
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
                domain(urlSlug: "updated-user-write-update-domain-ca") {
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
        assert result_refr == executed


@pytest.mark.usefixtures("domain_test_db_init")
def test_domain_removal_user_write():
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
                domain(urlSlug: "user-write-remove-domain-ca") {
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
            not session.query(Domains)
            .filter(Domains.domain == "user.write.remove.domain.ca")
            .all()
        )
        assert not session.query(Scans).filter(Scans.id == 3).all()
        assert not session.query(Dkim_scans).filter(Dkim_scans.id == 3).all()
        assert not session.query(Dmarc_scans).filter(Dmarc_scans.id == 3).all()
        assert not session.query(Https_scans).filter(Https_scans.id == 3).all()
        assert not session.query(Mx_scans).filter(Mx_scans.id == 3).all()
        assert not session.query(Ssl_scans).filter(Ssl_scans.id == 3).all()
        assert not session.query(Spf_scans).filter(Spf_scans.id == 3).all()


# Different Org User Write
@pytest.mark.usefixtures("domain_test_db_init")
def test_domain_creation_diff_org_user_write():
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
                createDomain(orgSlug: "organization-1", url: "admin2.create.domain.ca") {
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


@pytest.mark.usefixtures("domain_test_db_init")
def test_domain_modification_diff_org_user_write():
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


@pytest.mark.usefixtures("domain_test_db_init")
def test_domain_removal_diff_org_user_write():
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
@pytest.mark.usefixtures("domain_test_db_init")
def test_domain_creation_org_user_read():
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
                createDomain(orgSlug: "organization-1", url: "user.read.create.domain.ca") {
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


@pytest.mark.usefixtures("domain_test_db_init")
def test_domain_modification_org_user_read():
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


@pytest.mark.usefixtures("domain_test_db_init")
def test_domain_removal_org_user_read():
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
