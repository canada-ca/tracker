import pytest
from pytest import fail
from json_web_token import tokenize, auth_header
from flask import Request
from graphene.test import Client
from app import app
from db import DB
from queries import schema
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
    Ssl_scans,
)
from tests.testdata import accurateplastics_report

s, cleanup, session = DB()


@pytest.fixture
def save():
    with app.app_context():
        yield s
        session.rollback()
        cleanup()

@pytest.mark.skip
def test_get_domain_resolver_dmarc_report(save):
    """
    Test to see if all values appear
    """
    user = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(
                permission="user_read",
                user_organization=Organizations(
                    acronym="ORG1",
                    name="Organization 1",
                    domains=[
                        Domains(
                            domain="accurateplastics.com",
                            dmarc_reports=[
                                Dmarc_Reports(
                                    start_date="2018-10-01 13:07:12",
                                    end_date="2018-10-01 13:07:12",
                                    report=accurateplastics_report,
                                )
                            ],
                        ),
                        Domains(domain="addisonfoods.com"),
                    ],
                ),
            )
        ],
    )
    save(user)

    token = tokenize(user_id=user.id, roles=user.roles)

    result = Client(schema).execute(
        """
        {
            domain(urlSlug: "accurateplastics-com") {
                url
                slug
                dmarcReport {
                    edges {
                        node {
                            reportId
                            orgName
                            orgEmail
                            startDate
                            endDate
                        }
                    }
                }
            }
        }
        """,
        context_value=auth_header(token),
    )

    if "errors" in result:
        fail("Expected dmarcReport query to succeed. Instead: {}".format(result))

    expected = {
        "data": {
            "domain": [
                {
                    "url": "accurateplastics.com",
                    "slug": "accurateplastics-com",
                    "dmarcReport": {
                        "edges": [
                            {
                                "node": {
                                    "reportId": "example.com:1538463741",
                                    "orgName": "accurateplastics.com",
                                    "orgEmail": "administrator@accurateplastics.com",
                                    "startDate": "2018-10-01T13:07:12",
                                    "endDate": "2018-10-01T13:07:12",
                                }
                            }
                        ]
                    },
                }
            ]
        }
    }
    assert expected == result

@pytest.mark.skip
def test_get_domain_resolver_dmarc_report_in_date_range(save):
    """
    Test to see if all values appear
    """
    user = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(
                permission="user_read",
                user_organization=Organizations(
                    acronym="ORG1",
                    name="Organization 1",
                    domains=[
                        Domains(
                            domain="accurateplastics.com",
                            dmarc_reports=[
                                Dmarc_Reports(
                                    start_date="2018-10-01 13:07:12",
                                    end_date="2018-10-01 13:07:12",
                                    report=accurateplastics_report,
                                )
                            ],
                        ),
                    ],
                ),
            )
        ],
    )
    save(user)

    token = tokenize(user_id=user.id, roles=user.roles)

    result = Client(schema).execute(
        """
         {
             domain(urlSlug: "accurateplastics-com") {
                 url
                 slug
                 dmarcReport(startDate: "2018-01-01" endDate: "2018-12-31") {
                     edges {
                         node {
                             reportId
                             orgName
                             orgEmail
                             startDate
                             endDate
                         }
                     }
                 }
             }
         }
        """,
        context_value=auth_header(token),
    )

    if "errors" in result:
        fail("Expected dmarcReport query to succeed. Instead: {}".format(result))

    expected = {
        "data": {
            "domain": [
                {
                    "url": "accurateplastics.com",
                    "slug": "accurateplastics-com",
                    "dmarcReport": {
                        "edges": [
                            {
                                "node": {
                                    "reportId": "example.com:1538463741",
                                    "orgName": "accurateplastics.com",
                                    "orgEmail": "administrator@accurateplastics.com",
                                    "startDate": "2018-10-01T13:07:12",
                                    "endDate": "2018-10-01T13:07:12",
                                }
                            }
                        ]
                    },
                }
            ]
        }
    }
    assert expected == result

@pytest.mark.skip
def test_get_domain_resolver_dmarc_report_for_date_range_with_no_reports(save):
    user = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(
                permission="user_read",
                user_organization=Organizations(
                    acronym="ORG1",
                    name="Organization 1",
                    domains=[
                        Domains(
                            domain="accurateplastics.com",
                            dmarc_reports=[
                                Dmarc_Reports(
                                    start_date="2018-10-01 13:07:12",
                                    end_date="2018-10-01 13:07:12",
                                    report=accurateplastics_report,
                                )
                            ],
                        ),
                    ],
                ),
            )
        ],
    )
    save(user)

    token = tokenize(user_id=user.id, roles=user.roles)

    result = Client(schema).execute(
        """
         {
             domain(urlSlug: "accurateplastics-com") {
                 url
                 slug
                 dmarcReport(startDate: "2019-01-01" endDate: "2019-12-31") {
                     edges {
                         node {
                             reportId
                             orgName
                             orgEmail
                             startDate
                             endDate
                         }
                     }
                 }
             }
         }
        """,
        context_value=auth_header(token),
    )

    if "errors" not in result:
        fail(
            "Expected dmarcReport query for report dates we don't have to fail. Instead: {}".format(
                result
            )
        )

@pytest.mark.skip
def test_domain_resolver_dmarc_report_for_domain_with_no_reports_will_fail(save):
    user = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(
                permission="user_read",
                user_organization=Organizations(
                    acronym="ORG1", domains=[Domains(domain="addisonfoods.com"),],
                ),
            )
        ],
    )
    save(user)

    token = tokenize(user_id=user.id, roles=user.roles)

    result = Client(schema).execute(
        """
         {
             domain(urlSlug: "addisonfoods-com") {
                 url
                 slug
                 dmarcReport {
                     edges {
                         node {
                             reportId
                             orgName
                             orgEmail
                             startDate
                             endDate
                         }
                     }
                 }
             }
         }
        """,
        context_value=auth_header(token),
    )

    if "errors" not in result:
        fail(
            "Expected dmarcReport query for report dates we don't have to fail. Instead: {}".format(
                result
            )
        )

    [error] = result["errors"]
    assert error["message"] == "Error, no reports for that domain."

@pytest.mark.skip
def test_get_domain_resolver_dmarc_report_returns_error_if_start_date_is_missing(save):
    user = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(
                permission="user_read",
                user_organization=Organizations(
                    acronym="ORG1",
                    name="Organization 1",
                    domains=[
                        Domains(
                            domain="accurateplastics.com",
                            dmarc_reports=[
                                Dmarc_Reports(
                                    start_date="2018-10-01 13:07:12",
                                    end_date="2018-10-01 13:07:12",
                                    report=accurateplastics_report,
                                )
                            ],
                        ),
                    ],
                ),
            )
        ],
    )
    save(user)

    token = tokenize(user_id=user.id, roles=user.roles)

    result = Client(schema).execute(
        """
         {
             domain(urlSlug: "accurateplastics-com") {
                 url
                 slug
                 dmarcReport(endDate: "2019-12-31") {
                     edges {
                         node {
                             reportId
                             orgName
                             orgEmail
                             startDate
                             endDate
                         }
                     }
                 }
             }
         }
        """,
        context_value=auth_header(token),
    )

    if "errors" not in result:
        fail(
            "Expected dmarcReport query with no start date to fail. Instead: {}".format(
                result
            )
        )

    [error] = result["errors"]
    assert error["message"] == "Error, both start and end dates are required."

@pytest.mark.skip
def test_get_domain_resolver_dmarc_report_returns_error_if_end_date_is_missing(save):
    user = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(
                permission="user_read",
                user_organization=Organizations(
                    acronym="ORG1",
                    name="Organization 1",
                    domains=[
                        Domains(
                            domain="accurateplastics.com",
                            dmarc_reports=[
                                Dmarc_Reports(
                                    start_date="2018-10-01 13:07:12",
                                    end_date="2018-10-01 13:07:12",
                                    report=accurateplastics_report,
                                )
                            ],
                        ),
                    ],
                ),
            )
        ],
    )
    save(user)

    token = tokenize(user_id=user.id, roles=user.roles)

    result = Client(schema).execute(
        """
         {
             domain(urlSlug: "accurateplastics-com") {
                 url
                 slug
                 dmarcReport(startDate: "2019-12-31") {
                     edges {
                         node {
                             reportId
                             orgName
                             orgEmail
                             startDate
                             endDate
                         }
                     }
                 }
             }
         }
        """,
        context_value=auth_header(token),
    )

    if "errors" not in result:
        fail(
            "Expected dmarcReport query with no start date to fail. Instead: {}".format(
                result
            )
        )

    [error] = result["errors"]
    assert error["message"] == "Error, both start and end dates are required."
