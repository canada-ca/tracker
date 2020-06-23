import logging
import pytest

from pytest import fail

from db import DB
from models import (
    Organizations,
    Domains,
    Users,
    User_affiliations,
    Web_scans,
    Mail_scans,
    Dkim_scans,
    Dmarc_scans,
    Https_scans,
    Mx_scans,
    Spf_scans,
    Ssl_scans,
)
from tests.test_functions import json, run


@pytest.fixture
def db():
    save, cleanup, session = DB()
    yield [save, session]
    cleanup()


def test_remove_domain_super_admin(db, caplog):
    """
    Test to see if super admins can remove domains
    """
    [save, session] = db
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1"
    )
    save(org_one)

    super_admin = Users(
        display_name="testsuperadmin",
        user_name="testsuperadmin@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(
                permission="super_admin",
                user_organization=Organizations(
                    acronym="SA", name="Super Admin", slug="super-admin"
                ),
            ),
        ],
    )
    save(super_admin)

    test_domain = Domains(domain="sa.remove.domain.ca", organization_id=org_one.id,)
    save(test_domain)
    test_web_scan = Web_scans(domain_id=test_domain.id)
    test_mail_scan = Mail_scans(domain_id=test_domain.id)
    web_scan_id = test_web_scan.id
    mail_scan_id = test_mail_scan.id
    save(test_web_scan)
    save(test_mail_scan)
    test_dkim = Dkim_scans(id=test_mail_scan.id)
    save(test_dkim)
    test_dmarc = Dmarc_scans(id=test_mail_scan.id)
    save(test_dmarc)
    test_https = Https_scans(id=test_web_scan.id)
    save(test_https)
    test_mx = Mx_scans(id=test_mail_scan.id)
    save(test_mx)
    test_ssl = Ssl_scans(id=test_web_scan.id)
    save(test_ssl)
    test_spf = Spf_scans(id=test_mail_scan.id)
    save(test_spf)

    caplog.set_level(logging.INFO)
    remove_result = run(
        mutation="""
        mutation{
            removeDomain(
                url: "sa.remove.domain.ca"
            ) {
                status
            }
        }
        """,
        as_user=super_admin,
    )

    if "errors" in remove_result:
        fail("Expected to remove a domain, instead: {}".format(json(remove_result)))

    assert (
        not session.query(Domains).filter(Domains.domain == "sa.remove.domain.ca").all()
    )
    assert not session.query(Web_scans).filter(Web_scans.id == web_scan_id).all()
    assert not session.query(Mail_scans).filter(Mail_scans.id == mail_scan_id).all()
    assert not session.query(Dkim_scans).filter(Dkim_scans.id == mail_scan_id).all()
    assert not session.query(Dmarc_scans).filter(Dmarc_scans.id == mail_scan_id).all()
    assert not session.query(Https_scans).filter(Https_scans.id == web_scan_id).all()
    assert not session.query(Mx_scans).filter(Mx_scans.id == mail_scan_id).all()
    assert not session.query(Ssl_scans).filter(Ssl_scans.id == web_scan_id).all()
    assert not session.query(Spf_scans).filter(Spf_scans.id == mail_scan_id).all()
    assert (
        f"User: {super_admin.id} successfully removed sa.remove.domain.ca and all related scans."
        in caplog.text
    )


def test_remove_domain_super_admin_cant_remove_domain_doesnt_exist(db, caplog):
    """
    Test to see if super admin cant remove domains from that don't exist
    """
    [save, _] = db
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1"
    )
    save(org_one)

    super_admin = Users(
        display_name="testsuperadmin",
        user_name="testsuperadmin@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(
                permission="super_admin",
                user_organization=Organizations(
                    acronym="SA", name="Super Admin", slug="super-admin"
                ),
            ),
        ],
    )
    save(super_admin)

    caplog.set_level(logging.WARNING)
    remove_result = run(
        mutation="""
        mutation{
            removeDomain(
                url: "sa.remove.domain.ca"
            ) {
                status
            }
        }
        """,
        as_user=super_admin,
    )

    if "errors" not in remove_result:
        fail("Expected to generate an error, instead: {}".format(json(remove_result)))

    [error] = remove_result["errors"]
    assert error["message"] == "Error, unable to remove domain."
    assert (
        f"User: {super_admin.id} tried to remove domain: sa.remove.domain.ca, but it does not exist."
        in caplog.text
    )


def test_remove_domain_org_admin(db, caplog):
    """
    Test to see if org admins can remove domains
    """
    [save, session] = db
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1"
    )
    save(org_one)

    org_admin = Users(
        display_name="testadmin",
        user_name="testadmin@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="admin", user_organization=org_one,),
        ],
    )
    save(org_admin)

    test_domain = Domains(domain="admin.remove.domain.ca", organization_id=org_one.id,)
    save(test_domain)
    test_web_scan = Web_scans(domain_id=test_domain.id)
    test_mail_scan = Mail_scans(domain_id=test_domain.id)
    web_scan_id = test_web_scan.id
    mail_scan_id = test_mail_scan.id
    save(test_web_scan)
    save(test_mail_scan)
    test_dkim = Dkim_scans(id=test_mail_scan.id)
    save(test_dkim)
    test_dmarc = Dmarc_scans(id=test_mail_scan.id)
    save(test_dmarc)
    test_https = Https_scans(id=test_web_scan.id)
    save(test_https)
    test_mx = Mx_scans(id=test_mail_scan.id)
    save(test_mx)
    test_ssl = Ssl_scans(id=test_web_scan.id)
    save(test_ssl)
    test_spf = Spf_scans(id=test_mail_scan.id)
    save(test_spf)

    caplog.set_level(logging.INFO)
    remove_result = run(
        mutation="""
        mutation{
            removeDomain(
                url: "admin.remove.domain.ca"
            ) {
                status
            }
        }
        """,
        as_user=org_admin,
    )

    if "errors" in remove_result:
        fail("Expected to remove a domain, instead: {}".format(json(remove_result)))

    assert (
        not session.query(Domains).filter(Domains.domain == "sa.remove.domain.ca").all()
    )
    assert not session.query(Web_scans).filter(Web_scans.id == web_scan_id).all()
    assert not session.query(Mail_scans).filter(Mail_scans.id == mail_scan_id).all()
    assert not session.query(Dkim_scans).filter(Dkim_scans.id == mail_scan_id).all()
    assert not session.query(Dmarc_scans).filter(Dmarc_scans.id == mail_scan_id).all()
    assert not session.query(Https_scans).filter(Https_scans.id == web_scan_id).all()
    assert not session.query(Mx_scans).filter(Mx_scans.id == mail_scan_id).all()
    assert not session.query(Ssl_scans).filter(Ssl_scans.id == web_scan_id).all()
    assert not session.query(Spf_scans).filter(Spf_scans.id == mail_scan_id).all()
    assert (
        f"User: {org_admin.id} successfully removed admin.remove.domain.ca and all related scans."
        in caplog.text
    )


def test_remove_domain_org_admin_cant_remove_diff_org(db, caplog):
    """
    Test to see if org admins cant remove domains from different orgs
    """
    [save, _] = db
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1"
    )
    save(org_one)
    org_two = Organizations(
        acronym="ORG2", name="Organization 2", slug="organization-2"
    )
    save(org_two)

    org_admin = Users(
        display_name="testadmin",
        user_name="testadmin@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="admin", user_organization=org_one,),
        ],
    )
    save(org_admin)

    test_domain = Domains(domain="admin.remove.domain.ca", organization_id=org_two.id,)
    save(test_domain)

    caplog.set_level(logging.WARNING)
    remove_result = run(
        mutation="""
        mutation{
            removeDomain(
                url: "admin.remove.domain.ca"
            ) {
                status
            }
        }
        """,
        as_user=org_admin,
    )

    if "errors" not in remove_result:
        fail("Expected to generate an error, instead: {}".format(json(remove_result)))

    [error] = remove_result["errors"]
    assert error["message"] == "Error, unable to remove domain."
    assert f"User: {org_admin.id} tried to remove admin.remove.domain.ca but does not have proper access to remove this domain."


def test_remove_domain_org_admin_cant_remove_domain_doesnt_exist(db, caplog):
    """
    Test to see if org admin cant remove domains from that don't exist
    """
    [save, _] = db
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1"
    )
    save(org_one)

    org_admin = Users(
        display_name="testadmin",
        user_name="testadmin@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="admin", user_organization=org_one,),
        ],
    )
    save(org_admin)

    caplog.set_level(logging.WARNING)
    remove_result = run(
        mutation="""
        mutation{
            removeDomain(
                url: "admin.remove.domain.ca"
            ) {
                status
            }
        }
        """,
        as_user=org_admin,
    )

    if "errors" not in remove_result:
        fail("Expected to generate an error, instead: {}".format(json(remove_result)))

    [error] = remove_result["errors"]
    assert error["message"] == "Error, unable to remove domain."
    assert (
        f"User: {org_admin.id} tried to remove domain: admin.remove.domain.ca, but it does not exist."
        in caplog.text
    )


def test_remove_domain_user_write(db, caplog):
    """
    Test to see if user write can remove domains
    """
    [save, session] = db
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1"
    )
    save(org_one)

    user_write = Users(
        display_name="testuserwrite",
        user_name="testuserwrite@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="user_write", user_organization=org_one,),
        ],
    )
    save(user_write)

    test_domain = Domains(
        domain="user.write.remove.domain.ca", organization_id=org_one.id,
    )
    save(test_domain)
    test_web_scan = Web_scans(domain_id=test_domain.id)
    test_mail_scan = Mail_scans(domain_id=test_domain.id)
    web_scan_id = test_web_scan.id
    mail_scan_id = test_mail_scan.id
    save(test_web_scan)
    save(test_mail_scan)
    test_dkim = Dkim_scans(id=test_mail_scan.id)
    save(test_dkim)
    test_dmarc = Dmarc_scans(id=test_mail_scan.id)
    save(test_dmarc)
    test_https = Https_scans(id=test_web_scan.id)
    save(test_https)
    test_mx = Mx_scans(id=test_mail_scan.id)
    save(test_mx)
    test_ssl = Ssl_scans(id=test_web_scan.id)
    save(test_ssl)
    test_spf = Spf_scans(id=test_mail_scan.id)
    save(test_spf)

    caplog.set_level(logging.INFO)
    remove_result = run(
        mutation="""
        mutation{
            removeDomain(
                url: "user.write.remove.domain.ca"
            ) {
                status
            }
        }
        """,
        as_user=user_write,
    )

    if "errors" in remove_result:
        fail("Expected to remove a domain, instead: {}".format(json(remove_result)))

    assert (
        not session.query(Domains).filter(Domains.domain == "sa.remove.domain.ca").all()
    )
    assert not session.query(Web_scans).filter(Web_scans.id == web_scan_id).all()
    assert not session.query(Mail_scans).filter(Mail_scans.id == mail_scan_id).all()
    assert not session.query(Dkim_scans).filter(Dkim_scans.id == mail_scan_id).all()
    assert not session.query(Dmarc_scans).filter(Dmarc_scans.id == mail_scan_id).all()
    assert not session.query(Https_scans).filter(Https_scans.id == web_scan_id).all()
    assert not session.query(Mx_scans).filter(Mx_scans.id == mail_scan_id).all()
    assert not session.query(Ssl_scans).filter(Ssl_scans.id == web_scan_id).all()
    assert not session.query(Spf_scans).filter(Spf_scans.id == mail_scan_id).all()
    assert (
        f"User: {user_write.id} successfully removed user.write.remove.domain.ca and all related scans."
        in caplog.text
    )


def test_remove_domain_user_write_cant_remove_diff_org(db, caplog):
    """
    Test to see if user write cant remove domains from different orgs
    """
    [save, _] = db
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1"
    )
    save(org_one)
    org_two = Organizations(
        acronym="ORG2", name="Organization 2", slug="organization-2"
    )
    save(org_two)

    user_write = Users(
        display_name="testuserwrite",
        user_name="testuserwrite@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="user_write", user_organization=org_one,),
        ],
    )
    save(user_write)

    test_domain = Domains(
        domain="user.write.remove.domain.ca", organization_id=org_two.id,
    )
    save(test_domain)

    caplog.set_level(logging.WARNING)
    remove_result = run(
        mutation="""
        mutation{
            removeDomain(
                url: "user.write.remove.domain.ca"
            ) {
                status
            }
        }
        """,
        as_user=user_write,
    )

    if "errors" not in remove_result:
        fail("Expected to generate an error, instead: {}".format(json(remove_result)))

    [error] = remove_result["errors"]
    assert error["message"] == "Error, unable to remove domain."
    assert (
        f"User: {user_write.id} tried to remove user.write.remove.domain.ca but does not have proper access to remove this domain."
        in caplog.text
    )


def test_remove_domain_user_write_cant_remove_domain_doesnt_exist(db, caplog):
    """
    Test to see if user write cant remove domains from that don't exist
    """
    [save, _] = db
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1"
    )
    save(org_one)

    user_write = Users(
        display_name="testuserwrite",
        user_name="testuserwrite@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="user_write", user_organization=org_one,),
        ],
    )
    save(user_write)

    caplog.set_level(logging.WARNING)
    remove_result = run(
        mutation="""
        mutation{
            removeDomain(
                url: "user.write.remove.domain.ca"
            ) {
                status
            }
        }
        """,
        as_user=user_write,
    )

    if "errors" not in remove_result:
        fail("Expected to generate an error, instead: {}".format(json(remove_result)))

    [error] = remove_result["errors"]
    assert error["message"] == "Error, unable to remove domain."
    assert (
        f"User: {user_write.id} tried to remove domain: user.write.remove.domain.ca, but it does not exist."
        in caplog.text
    )


def test_remove_domain_user_read_cant_remove_domains(db, caplog):
    """
    Test to see if user read cant remove domains from orgs
    """
    [save, _] = db
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1"
    )
    save(org_one)

    user_read = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org_one,),
        ],
    )
    save(user_read)

    test_domain = Domains(
        domain="user.read.remove.domain.ca", organization_id=org_one.id,
    )
    save(test_domain)

    caplog.set_level(logging.WARNING)
    remove_result = run(
        mutation="""
        mutation{
            removeDomain(
                url: "user.read.remove.domain.ca"
            ) {
                status
            }
        }
        """,
        as_user=user_read,
    )

    if "errors" not in remove_result:
        fail("Expected to generate an error, instead: {}".format(json(remove_result)))

    [error] = remove_result["errors"]
    assert error["message"] == "Error, unable to remove domain."
    assert (
        f"User: {user_read.id} tried to remove user.read.remove.domain.ca but does not have proper access to remove this domain."
        in caplog.text
    )
