import logging
import pytest

from pytest import fail

from app import app
from db import DB
from models import (
    Organizations,
    Domains,
    Users,
    User_affiliations,
)
from tests.testdata.dmarc_report_summary import api_return_data
from tests.test_functions import run, json


@pytest.fixture
def save():
    with app.app_context():
        s, cleanup, session = DB()
        yield s
        session.rollback()
        cleanup()


def test_valid_get_dmarc_report_summary_query_as_super_admin(save, mocker, caplog):
    """
    Test to see if super admins can query any data
    """
    mocker.patch(
        "schemas.dmarc_report_summary.resolver.send_request",
        autospec=True,
        return_value=api_return_data,
    )

    org_one = Organizations(
        acronym="ORG1",
        name="Organization 1",
        slug="organization-1",
        domains=[Domains(domain="test.domain.gc.ca", slug="test-domain-gc-ca")],
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

    caplog.set_level(logging.INFO)
    result = run(
        query="""
        {
            dmarcReportSummary (
                domainSlug: "test-domain-gc-ca"
                period: MAY
                year: "2020"
            ) {
                year
                month
                categoryTotals {
                    fullPass
                    passSpfOnly
                    passDkimOnly
                    fail
                    total
                }
            }
        }
        """,
        as_user=super_admin,
    )

    if "errors" in result:
        fail("Expected to get return data, instead: {}".format(json(result)))

    expected_result = {
        "data": {
            "dmarcReportSummary": {
                "year": 2020,
                "month": "May",
                "categoryTotals": {
                    "passSpfOnly": 168,
                    "passDkimOnly": 168,
                    "fullPass": 8331,
                    "fail": 570,
                    "total": 9237,
                },
            }
        }
    }

    assert result == expected_result
    assert (
        f"User: {super_admin.id} successfully retrieved the DmarcReportSummary for: test-domain-gc-ca."
        in caplog.text
    )


def test_valid_get_dmarc_report_summary_query_as_org_admin(save, mocker, caplog):
    """
    Test to see if org admins can query any data
    """
    mocker.patch(
        "schemas.dmarc_report_summary.resolver.send_request",
        autospec=True,
        return_value=api_return_data,
    )

    org_admin = Users(
        display_name="testadmin",
        user_name="testadmin@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(
                permission="admin",
                user_organization=Organizations(
                    acronym="ORG1",
                    name="Organization 1",
                    slug="organization-1",
                    domains=[Domains(domain="test.domain.gc.ca")],
                ),
            ),
        ],
    )
    save(org_admin)

    caplog.set_level(logging.INFO)
    result = run(
        query="""
        {
            dmarcReportSummary (
                domainSlug: "test-domain-gc-ca"
                period: MAY
                year: "2020"
            ) {
                year
                month
                categoryTotals {
                    fullPass
                    passSpfOnly
                    passDkimOnly
                    fail
                    total
                }
            }
        }
        """,
        as_user=org_admin,
    )

    if "errors" in result:
        fail("Expected to get return data, instead: {}".format(json(result)))

    expected_result = {
        "data": {
            "dmarcReportSummary": {
                "year": 2020,
                "month": "May",
                "categoryTotals": {
                    "passSpfOnly": 168,
                    "passDkimOnly": 168,
                    "fullPass": 8331,
                    "fail": 570,
                    "total": 9237,
                },
            }
        }
    }

    assert result == expected_result
    assert (
        f"User: {org_admin.id} successfully retrieved the DmarcReportSummary for: test-domain-gc-ca."
        in caplog.text
    )


def test_valid_get_dmarc_report_summary_query_as_user_write(save, mocker, caplog):
    """
    Test to see if user write can query any data
    """
    mocker.patch(
        "schemas.dmarc_report_summary.resolver.send_request",
        autospec=True,
        return_value=api_return_data,
    )

    user_write = Users(
        display_name="testuserwrite",
        user_name="testuserwrite@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(
                permission="user_write",
                user_organization=Organizations(
                    acronym="ORG1",
                    name="Organization 1",
                    slug="organization-1",
                    domains=[Domains(domain="test.domain.gc.ca")],
                ),
            ),
        ],
    )
    save(user_write)

    caplog.set_level(logging.INFO)
    result = run(
        query="""
        {
            dmarcReportSummary (
                domainSlug: "test-domain-gc-ca"
                period: MAY
                year: "2020"
            ) {
                year
                month
                categoryTotals {
                    fullPass
                    passSpfOnly
                    passDkimOnly
                    fail
                    total
                }
            }
        }
        """,
        as_user=user_write,
    )

    if "errors" in result:
        fail("Expected to get return data, instead: {}".format(json(result)))

    expected_result = {
        "data": {
            "dmarcReportSummary": {
                "year": 2020,
                "month": "May",
                "categoryTotals": {
                    "passSpfOnly": 168,
                    "passDkimOnly": 168,
                    "fullPass": 8331,
                    "fail": 570,
                    "total": 9237,
                },
            }
        }
    }

    assert result == expected_result
    assert (
        f"User: {user_write.id} successfully retrieved the DmarcReportSummary for: test-domain-gc-ca."
        in caplog.text
    )


def test_valid_get_dmarc_report_summary_query_as_user_read(save, mocker, caplog):
    """
    Test to see if user read can query any data
    """
    mocker.patch(
        "schemas.dmarc_report_summary.resolver.send_request",
        autospec=True,
        return_value=api_return_data,
    )

    user_read = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(
                permission="user_read",
                user_organization=Organizations(
                    acronym="ORG1",
                    name="Organization 1",
                    slug="organization-1",
                    domains=[Domains(domain="test.domain.gc.ca")],
                ),
            ),
        ],
    )
    save(user_read)

    caplog.set_level(logging.INFO)
    result = run(
        query="""
        {
            dmarcReportSummary (
                domainSlug: "test-domain-gc-ca"
                period: MAY
                year: "2020"
            ) {
                year
                month
                categoryTotals {
                    fullPass
                    passSpfOnly
                    passDkimOnly
                    fail
                    total
                }
            }
        }
        """,
        as_user=user_read,
    )

    if "errors" in result:
        fail("Expected to get return data, instead: {}".format(json(result)))

    expected_result = {
        "data": {
            "dmarcReportSummary": {
                "year": 2020,
                "month": "May",
                "categoryTotals": {
                    "passSpfOnly": 168,
                    "passDkimOnly": 168,
                    "fullPass": 8331,
                    "fail": 570,
                    "total": 9237,
                },
            }
        }
    }

    assert result == expected_result
    assert (
        f"User: {user_read.id} successfully retrieved the DmarcReportSummary for: test-domain-gc-ca."
        in caplog.text
    )


def test_dmarc_report_summary_admin_from_different_org_cant_access_data(
    save, mocker, caplog
):
    """
    Test to ensure admins from different orgs cant access this information
    """
    mocker.patch(
        "schemas.dmarc_report_summary.resolver.send_request",
        autospec=True,
        return_value=api_return_data,
    )

    org_one = Organizations(
        acronym="ORG1",
        name="Organization 1",
        slug="organization-1",
        domains=[Domains(domain="test.domain.gc.ca")],
    )
    save(org_one)

    org_admin = Users(
        display_name="testadmin",
        user_name="testadmin@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(
                permission="admin",
                user_organization=Organizations(
                    acronym="ORG2", name="Organization 2", slug="organization-2",
                ),
            ),
        ],
    )
    save(org_admin)

    caplog.set_level(logging.WARNING)
    result = run(
        query="""
        {
            dmarcReportSummary (
                domainSlug: "test-domain-gc-ca"
                period: MAY
                year: "2020"
            ) {
                year
                month
                categoryTotals {
                    fullPass
                    passSpfOnly
                    passDkimOnly
                    fail
                    total
                }
            }
        }
        """,
        as_user=org_admin,
    )

    if "errors" not in result:
        fail("Expected to error out, instead: {}".format(json(result)))

    [error] = result["errors"]
    assert error["message"] == "Error, dmarc summary cannot be found."
    assert (
        f"User: {org_admin.id} tried to retrieved the DmarcReportSummary for: test-domain-gc-ca but does not have access to organization-1."
        in caplog.text
    )


def test_dmarc_report_summary_user_write_from_different_org_cant_access_data(
    save, mocker, caplog
):
    """
    Test to ensure user write from different orgs cant access this information
    """
    mocker.patch(
        "schemas.dmarc_report_summary.resolver.send_request",
        autospec=True,
        return_value=api_return_data,
    )

    org_one = Organizations(
        acronym="ORG1",
        name="Organization 1",
        slug="organization-1",
        domains=[Domains(domain="test.domain.gc.ca")],
    )
    save(org_one)

    user_write = Users(
        display_name="testadmin",
        user_name="testadmin@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(
                permission="user_write",
                user_organization=Organizations(
                    acronym="ORG2", name="Organization 2", slug="organization-2",
                ),
            ),
        ],
    )
    save(user_write)

    caplog.set_level(logging.WARNING)
    result = run(
        query="""
        {
            dmarcReportSummary (
                domainSlug: "test-domain-gc-ca"
                period: MAY
                year: "2020"
            ) {
                year
                month
                categoryTotals {
                    fullPass
                    passSpfOnly
                    passDkimOnly
                    fail
                    total
                }
            }
        }
        """,
        as_user=user_write,
    )

    if "errors" not in result:
        fail("Expected to error out, instead: {}".format(json(result)))

    [error] = result["errors"]
    assert error["message"] == "Error, dmarc summary cannot be found."
    assert (
        f"User: {user_write.id} tried to retrieved the DmarcReportSummary for: test-domain-gc-ca but does not have access to organization-1."
        in caplog.text
    )


def test_dmarc_report_summary_user_read_from_different_org_cant_access_data(
    save, mocker, caplog
):
    """
    Test to ensure user read from different orgs cant access this information
    """
    mocker.patch(
        "schemas.dmarc_report_summary.resolver.send_request",
        autospec=True,
        return_value=api_return_data,
    )

    org_one = Organizations(
        acronym="ORG1",
        name="Organization 1",
        slug="organization-1",
        domains=[Domains(domain="test.domain.gc.ca")],
    )
    save(org_one)

    user_read = Users(
        display_name="testadmin",
        user_name="testadmin@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(
                permission="user_read",
                user_organization=Organizations(
                    acronym="ORG2", name="Organization 2", slug="organization-2",
                ),
            ),
        ],
    )
    save(user_read)

    caplog.set_level(logging.WARNING)
    result = run(
        query="""
        {
            dmarcReportSummary (
                domainSlug: "test-domain-gc-ca"
                period: MAY
                year: "2020"
            ) {
                year
                month
                categoryTotals {
                    fullPass
                    passSpfOnly
                    passDkimOnly
                    fail
                    total
                }
            }
        }
        """,
        as_user=user_read,
    )

    if "errors" not in result:
        fail("Expected to error out, instead: {}".format(json(result)))

    [error] = result["errors"]
    assert error["message"] == "Error, dmarc summary cannot be found."
    assert (
        f"User: {user_read.id} tried to retrieved the DmarcReportSummary for: test-domain-gc-ca but does not have access to organization-1."
        in caplog.text
    )


def test_dmarc_report_summary_to_ensure_error_occurs_when_domain_does_not_exist(
    save, mocker, caplog
):
    """
    Test to ensure that if domain does not exist it errors out
    """
    mocker.patch(
        "schemas.dmarc_report_summary.resolver.send_request",
        autospec=True,
        return_value=api_return_data,
    )

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
    result = run(
        query="""
        {
            dmarcReportSummary (
                domainSlug: "test-domain-gc-ca"
                period: MAY
                year: "2020"
            ) {
                year
                month
                categoryTotals {
                    fullPass
                    passSpfOnly
                    passDkimOnly
                    fail
                    total
                }
            }
        }
        """,
        as_user=super_admin,
    )

    if "errors" not in result:
        fail("Expected to error out, instead: {}".format(json(result)))

    [error] = result["errors"]
    assert error["message"] == "Error, dmarc summary cannot be found."
    assert (
        f"User: {super_admin.id} tried to retrieved the DmarcReportSummary for: test-domain-gc-ca but domain does not exist."
        in caplog.text
    )
