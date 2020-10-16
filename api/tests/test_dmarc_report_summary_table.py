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
from tests.testdata.dmarc_report_summary_table import (
    api_return_data_1,
    api_return_data_2,
)
from tests.test_functions import run, json


@pytest.fixture
def save():
    with app.app_context():
        s, cleanup, session = DB()
        yield s
        session.rollback()
        cleanup()


def test_valid_get_dmarc_report_summary_table_query_as_super_admin(
    save, mocker, caplog
):
    """
    Test to see if super admins can query any data
    """
    mocker.patch(
        "schemas.dmarc_report_summary_table.resolver.send_request",
        autospec=True,
        side_effect=[api_return_data_1, api_return_data_2],
    )

    org_one = Organizations(
        acronym="ORG1",
        name="Organization 1",
        slug="organization-1",
        domains=[Domains(domain="test.domain.gc.ca", slug="test-domain-gc-ca")],
    )
    save(org_one)

    org_one = Organizations(
        acronym="ORG1",
        name="Organization 1",
        slug="organization-1",
        domains=[
            Domains(domain="test.domain.canada.ca", slug="test-domain-canada-ca"),
        ],
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
        query {
            dmarcReportSummaryTable (
                period: MAY
                year: "2020"
            ) {
                month
                year
                domains {
                    domain
                    fullPassPercentage
                    passSpfOnlyPercentage
                    passDkimOnlyPercentage
                    failPercentage
                    totalMessages
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
            "dmarcReportSummaryTable": {
                "year": "2020",
                "month": "May",
                "domains": [
                    {
                        "domain": "test.domain.gc.ca",
                        "failPercentage": 6,
                        "fullPassPercentage": 90,
                        "passDkimOnlyPercentage": 2,
                        "passSpfOnlyPercentage": 2,
                        "totalMessages": 9237,
                    },
                    {
                        "domain": "test.domain.canada.ca",
                        "failPercentage": 6,
                        "fullPassPercentage": 90,
                        "passDkimOnlyPercentage": 2,
                        "passSpfOnlyPercentage": 2,
                        "totalMessages": 9237,
                    },
                ],
            }
        }
    }

    assert result == expected_result
    assert (
        f"User: {super_admin.id} successfully retrieved the DmarcReportSummaryTable information for all their domains."
        in caplog.text
    )


def test_valid_get_dmarc_report_summary_table_query_as_org_admin(save, mocker, caplog):
    """
    Test to see if org admins can query any data
    """
    mocker.patch(
        "schemas.dmarc_report_summary_table.resolver.send_request",
        autospec=True,
        side_effect=[api_return_data_1, api_return_data_2],
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
        query {
            dmarcReportSummaryTable (
                period: MAY
                year: "2020"
            ) {
                month
                year
                domains {
                    domain
                    fullPassPercentage
                    passSpfOnlyPercentage
                    passDkimOnlyPercentage
                    failPercentage
                    totalMessages
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
            "dmarcReportSummaryTable": {
                "year": "2020",
                "month": "May",
                "domains": [
                    {
                        "domain": "test.domain.gc.ca",
                        "failPercentage": 6,
                        "fullPassPercentage": 90,
                        "passDkimOnlyPercentage": 2,
                        "passSpfOnlyPercentage": 2,
                        "totalMessages": 9237,
                    }
                ],
            }
        }
    }

    assert result == expected_result
    assert (
        f"User: {org_admin.id} successfully retrieved the DmarcReportSummaryTable information for all their domains."
        in caplog.text
    )


def test_valid_get_dmarc_report_summary_table_query_as_user_write(save, mocker, caplog):
    """
    Test to see if user write can query any data
    """
    mocker.patch(
        "schemas.dmarc_report_summary_table.resolver.send_request",
        autospec=True,
        side_effect=[api_return_data_1, api_return_data_2],
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
        query {
            dmarcReportSummaryTable (
                period: MAY
                year: "2020"
            ) {
                month
                year
                domains {
                    domain
                    fullPassPercentage
                    passSpfOnlyPercentage
                    passDkimOnlyPercentage
                    failPercentage
                    totalMessages
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
            "dmarcReportSummaryTable": {
                "year": "2020",
                "month": "May",
                "domains": [
                    {
                        "domain": "test.domain.gc.ca",
                        "failPercentage": 6,
                        "fullPassPercentage": 90,
                        "passDkimOnlyPercentage": 2,
                        "passSpfOnlyPercentage": 2,
                        "totalMessages": 9237,
                    }
                ],
            }
        }
    }

    assert result == expected_result
    assert (
        f"User: {user_write.id} successfully retrieved the DmarcReportSummaryTable information for all their domains."
        in caplog.text
    )


def test_valid_get_dmarc_report_summary_table_query_as_user_read(save, mocker, caplog):
    """
    Test to see if user read can query any data
    """
    mocker.patch(
        "schemas.dmarc_report_summary_table.resolver.send_request",
        autospec=True,
        side_effect=[api_return_data_1, api_return_data_2],
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
        query {
            dmarcReportSummaryTable (
                period: MAY
                year: "2020"
            ) {
                month
                year
                domains {
                    domain
                    fullPassPercentage
                    passSpfOnlyPercentage
                    passDkimOnlyPercentage
                    failPercentage
                    totalMessages
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
            "dmarcReportSummaryTable": {
                "year": "2020",
                "month": "May",
                "domains": [
                    {
                        "domain": "test.domain.gc.ca",
                        "failPercentage": 6,
                        "fullPassPercentage": 90,
                        "passDkimOnlyPercentage": 2,
                        "passSpfOnlyPercentage": 2,
                        "totalMessages": 9237,
                    }
                ],
            }
        }
    }

    assert result == expected_result
    assert (
        f"User: {user_read.id} successfully retrieved the DmarcReportSummaryTable information for all their domains."
        in caplog.text
    )


def test_dmarc_report_summary_to_ensure_error_occurs_when_no_domains_exist(
    save, mocker, caplog
):
    """
    Test to ensure that if domain does not exist it errors out
    """
    mocker.patch(
        "schemas.dmarc_report_summary_table.resolver.send_request",
        autospec=True,
        side_effect=[api_return_data_1, api_return_data_2],
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
        query {
            dmarcReportSummaryTable (
                period: MAY
                year: "2020"
            ) {
                month
                year
                domains {
                    domain
                    fullPassPercentage
                    passSpfOnlyPercentage
                    passDkimOnlyPercentage
                    failPercentage
                    totalMessages
                }
            }
        }
        """,
        as_user=super_admin,
    )

    if "errors" not in result:
        fail("Expected to error out, instead: {}".format(json(result)))

    [error] = result["errors"]
    assert (
        error["message"]
        == "Error, dmarc report summary table information cannot be found."
    )
    assert (
        f"User: {super_admin.id} tried to select DmarcReportSummaryTable information for all their domains, however they have no associated domains."
        in caplog.text
    )
