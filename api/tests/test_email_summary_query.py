import logging
import pytest

from pytest import fail

from db import DB
from models import Users, User_affiliations, Organizations, Summaries
from tests.test_functions import json, run


@pytest.fixture
def db():
    s, cleanup, session = DB()
    yield s, session
    cleanup()


def test_email_summary_super_admin(db, caplog):
    """"
    Test to see if super admin can successfully query the emailSummary Query
    """
    save, _ = db

    full_pass_summary = Summaries(
        name="full-pass", count=100, percentage=50, type="email",
    )
    save(full_pass_summary)

    full_fail_summary = Summaries(
        name="full-fail", count=50, percentage=25, type="email",
    )
    save(full_fail_summary)

    partial_pass_summary = Summaries(
        name="partial-pass", count=50, percentage=25, type="email",
    )
    save(partial_pass_summary)

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
            emailSummary {
                categories {
                    name
                    count
                    percentage
                }
                total
            }
        }
        """,
        as_user=super_admin,
    )

    if "errors" in result:
        fail(
            "Error occurred when trying to get email summary, error: {}".format(
                json(result)
            )
        )

    expected_result = {
        "data": {
            "emailSummary": {
                "categories": [
                    {"name": "partial-pass", "count": 50, "percentage": 25},
                    {"name": "full-fail", "count": 50, "percentage": 25},
                    {"name": "full-pass", "count": 100, "percentage": 50},
                ],
                "total": 200,
            },
        },
    }

    assert result == expected_result
    assert (
        f"User: {super_admin.id} successfully retrieved email summary information."
        in caplog.text
    )


def test_email_summary_org_admin(db, caplog):
    """"
    Test to see if org admin can successfully query the emailSummary Query
    """
    save, _ = db

    full_pass_summary = Summaries(
        name="full-pass", count=100, percentage=50, type="email",
    )
    save(full_pass_summary)

    full_fail_summary = Summaries(
        name="full-fail", count=50, percentage=25, type="email",
    )
    save(full_fail_summary)

    partial_pass_summary = Summaries(
        name="partial-pass", count=50, percentage=25, type="email",
    )
    save(partial_pass_summary)

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
                    acronym="ORG1", name="Organization 1", slug="organization-1"
                ),
            ),
        ],
    )
    save(org_admin)

    caplog.set_level(logging.INFO)
    result = run(
        query="""
        {
            emailSummary {
                categories {
                    name
                    count
                    percentage
                }
                total
            }
        }
        """,
        as_user=org_admin,
    )

    if "errors" in result:
        fail(
            "Error occurred when trying to get email summary, error: {}".format(
                json(result)
            )
        )

    expected_result = {
        "data": {
            "emailSummary": {
                "categories": [
                    {"name": "partial-pass", "count": 50, "percentage": 25},
                    {"name": "full-fail", "count": 50, "percentage": 25},
                    {"name": "full-pass", "count": 100, "percentage": 50},
                ],
                "total": 200,
            },
        },
    }

    assert result == expected_result
    assert (
        f"User: {org_admin.id} successfully retrieved email summary information."
        in caplog.text
    )


def test_email_summary_user_write(db, caplog):
    """"
    Test to see if user write can successfully query the emailSummary Query
    """
    save, _ = db

    full_pass_summary = Summaries(
        name="full-pass", count=100, percentage=50, type="email",
    )
    save(full_pass_summary)

    full_fail_summary = Summaries(
        name="full-fail", count=50, percentage=25, type="email",
    )
    save(full_fail_summary)

    partial_pass_summary = Summaries(
        name="partial-pass", count=50, percentage=25, type="email",
    )
    save(partial_pass_summary)

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
                    acronym="ORG1", name="Organization 1", slug="organization-1"
                ),
            ),
        ],
    )
    save(user_write)

    caplog.set_level(logging.INFO)
    result = run(
        query="""
        {
            emailSummary {
                categories {
                    name
                    count
                    percentage
                }
                total
            }
        }
        """,
        as_user=user_write,
    )

    if "errors" in result:
        fail(
            "Error occurred when trying to get email summary, error: {}".format(
                json(result)
            )
        )

    expected_result = {
        "data": {
            "emailSummary": {
                "categories": [
                    {"name": "partial-pass", "count": 50, "percentage": 25},
                    {"name": "full-fail", "count": 50, "percentage": 25},
                    {"name": "full-pass", "count": 100, "percentage": 50},
                ],
                "total": 200,
            },
        },
    }

    assert result == expected_result
    assert (
        f"User: {user_write.id} successfully retrieved email summary information."
        in caplog.text
    )


def test_email_summary_user_read(db, caplog):
    """"
    Test to see if user read can successfully query the emailSummary Query
    """
    save, _ = db

    full_pass_summary = Summaries(
        name="full-pass", count=100, percentage=50, type="email",
    )
    save(full_pass_summary)

    full_fail_summary = Summaries(
        name="full-fail", count=50, percentage=25, type="email",
    )
    save(full_fail_summary)

    partial_pass_summary = Summaries(
        name="partial-pass", count=50, percentage=25, type="email",
    )
    save(partial_pass_summary)

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
                    acronym="ORG1", name="Organization 1", slug="organization-1"
                ),
            ),
        ],
    )
    save(user_read)

    caplog.set_level(logging.INFO)
    result = run(
        query="""
        {
            emailSummary {
                categories {
                    name
                    count
                    percentage
                }
                total
            }
        }
        """,
        as_user=user_read,
    )

    if "errors" in result:
        fail(
            "Error occurred when trying to get email summary, error: {}".format(
                json(result)
            )
        )

    expected_result = {
        "data": {
            "emailSummary": {
                "categories": [
                    {"name": "partial-pass", "count": 50, "percentage": 25},
                    {"name": "full-fail", "count": 50, "percentage": 25},
                    {"name": "full-pass", "count": 100, "percentage": 50},
                ],
                "total": 200,
            },
        },
    }

    assert result == expected_result
    assert (
        f"User: {user_read.id} successfully retrieved email summary information."
        in caplog.text
    )


def test_email_summary_user_has_no_data_in_db(db, caplog):
    """"
    Test to see if error occurs when there is no data in the db
    """
    save, session = db

    user_read = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[],
    )
    save(user_read)

    caplog.set_level(logging.INFO)
    result = run(
        query="""
        {
            emailSummary {
                categories {
                    name
                    count
                    percentage
                }
                total
            }
        }
        """,
        as_user=user_read,
    )

    if "errors" not in result:
        fail(
            "Error should have occurred when trying to get email summary when there is no summary data in the db, instead: {}".format(
                json(result)
            )
        )

    [error] = result["errors"]
    assert error["message"] == "Error, email summary could not be found."
    assert (
        f"User: {user_read.id} tried to access email summary query but no email summaries could be found."
        in caplog.text
    )


def test_email_summary_user_has_no_permissions(db, caplog):
    """"
    Test to see if error occurs when user has no permissions
    """
    save, session = db

    full_pass_summary = Summaries(
        name="full-pass", count=100, percentage=50, type="email",
    )
    save(full_pass_summary)

    full_fail_summary = Summaries(
        name="full-fail", count=50, percentage=25, type="email",
    )
    save(full_fail_summary)

    partial_pass_summary = Summaries(
        name="partial-pass", count=50, percentage=25, type="email",
    )
    save(partial_pass_summary)

    user_read = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[],
    )
    save(user_read)

    session.query(Organizations).delete()
    session.query(User_affiliations).delete()
    session.commit()

    caplog.set_level(logging.INFO)
    result = run(
        query="""
        {
            emailSummary {
                categories {
                    name
                    count
                    percentage
                }
                total
            }
        }
        """,
        as_user=user_read,
    )

    if "errors" not in result:
        fail(
            "Error should have occurred when trying to get email summary when user has no permissions, instead: {}".format(
                json(result)
            )
        )

    [error] = result["errors"]
    assert error["message"] == "Error, email summary could not be found."
    assert (
        f"User: {user_read.id} tried to access email summary query but does not have any user read or higher access."
        in caplog.text
    )
