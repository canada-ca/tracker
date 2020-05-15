import pytest
from pytest import fail
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
)
from tests.testdata import accurateplastics_report
from tests.test_functions import json, run


@pytest.fixture
def save():
    with app.app_context():
        s, cleanup, session = DB()
        yield s
        session.rollback()
        cleanup()


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

    result = run(
        query="""
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
        as_user=user,
    )

    if "errors" in result:
        fail("Expected dmarcReport query to succeed. Instead: {}".format(json(result)))

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

    result = run(
        query="""
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
        as_user=user,
    )

    if "errors" in result:
        fail("Expected dmarcReport query to succeed. Instead: {}".format(json(result)))

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

    result = run(
        query="""
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
        as_user=user,
    )

    if "errors" not in result:
        fail(
            "Expected dmarcReport query for report dates we don't have to fail. Instead: {}".format(
                json(result)
            )
        )


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

    result = run(
        query="""
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
        as_user=user,
    )

    if "errors" not in result:
        fail(
            "Expected dmarcReport query for report dates we don't have to fail. Instead: {}".format(
                json(result)
            )
        )

    [error] = result["errors"]
    assert error["message"] == "Error, no reports for that domain."


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

    result = run(
        query="""
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
        as_user=user,
    )

    if "errors" not in result:
        fail(
            "Expected dmarcReport query with no start date to fail. Instead: {}".format(
                json(result)
            )
        )

    [error] = result["errors"]
    assert error["message"] == "Error, both start and end dates are required."


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

    result = run(
        query="""
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
        as_user=user,
    )

    if "errors" not in result:
        fail(
            "Expected dmarcReport query with no start date to fail. Instead: {}".format(
                json(result)
            )
        )

    [error] = result["errors"]
    assert error["message"] == "Error, both start and end dates are required."
