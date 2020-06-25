import logging
import pytest
import pytest_mock

from pytest import fail

from db import DB
from models import Users, User_affiliations, Organizations, Domains
from tests.test_functions import run, json


@pytest.fixture
def save():
    s, cleanup, session = DB()
    yield s
    cleanup()


def test_request_scan_mutation(save, mocker, caplog):
    """
    Test to see if user_write or higher can request scan
    """
    mocker.patch(
        "schemas.request_scan.request_scan.fire_scan",
        autospec=True,
        return_value="Scan successfully dispatched to designated scanners",
    )

    org_one = Organizations(
        acronym="ORG1",
        name="Organization 1",
        slug="organization-1",
        domains=[Domains(domain="test.domain.gc.ca", slug="test-domain-gc-ca")],
    )
    save(org_one)

    writer = Users(
        display_name="testuserwrite",
        user_name="testuserwrite@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="user_write", user_organization=org_one),
        ],
    )
    save(writer)

    caplog.set_level(logging.INFO)
    result = run(
        mutation="""
        mutation {
            requestScan (
                input: {
                    scanType: WEB,
                    urlSlug: "test-domain-gc-ca"
                }
            ) {
                requestStatus
            }
        }
        """,
        as_user=writer,
    )

    if "errors" in result:
        fail("Expected to request a scan, instead: {}".format(json(result)))

    expected_result = {
        "data": {
            "requestScan": {
                "requestStatus": "Scan successfully dispatched for test-domain-gc-ca"
            }
        }
    }

    assert result == expected_result
    assert (
        f"User: {writer.id} successfully dispatched a scan for test-domain-gc-ca."
        in caplog.text
    )


def test_request_scan_mutation_bad_dispatcher_response(save, mocker, caplog):
    """
    Test to see proper error gets returned when dispatcher fails
    """
    mocker.patch(
        "schemas.request_scan.request_scan.fire_scan",
        autospec=True,
        return_value="Failed to dispatch scan to designated scanner(s): Kernal Panic",
    )

    org_one = Organizations(
        acronym="ORG1",
        name="Organization 1",
        slug="organization-1",
        domains=[Domains(domain="test.domain.gc.ca", slug="test-domain-gc-ca")],
    )
    save(org_one)

    writer = Users(
        display_name="testuserwrite",
        user_name="testuserwrite@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="user_write", user_organization=org_one),
        ],
    )
    save(writer)

    caplog.set_level(logging.WARNING)
    result = run(
        mutation="""
        mutation {
            requestScan (
                input: {
                    scanType: WEB,
                    urlSlug: "test-domain-gc-ca"
                }
            ) {
                requestStatus
            }
        }
        """,
        as_user=writer,
    )

    if "errors" not in result:
        fail("Expected request scan error to occur, instead: {}".format(json(result)))

    [error] = result["errors"]
    assert error["message"] == "Error, unable to request scan."
    assert (
        f"User: {writer.id} attempted to dispatch a scan, but dispatcher returned: Failed to dispatch scan to designated scanner(s): Kernal Panic"
        in caplog.text
    )


def test_request_scan_mutation_no_domains_found(save, caplog):
    """
    Test to see proper error gets returned when domain cannot be found
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1", domains=[],
    )
    save(org_one)

    writer = Users(
        display_name="testuserwrite",
        user_name="testuserwrite@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="user_write", user_organization=org_one),
        ],
    )
    save(writer)

    caplog.set_level(logging.WARNING)
    result = run(
        mutation="""
        mutation {
            requestScan (
                input: {
                    scanType: WEB,
                    urlSlug: "test-domain-gc-ca"
                }
            ) {
                requestStatus
            }
        }
        """,
        as_user=writer,
    )

    if "errors" not in result:
        fail("Expected request scan error to occur, instead: {}".format(json(result)))

    [error] = result["errors"]
    assert error["message"] == "Error, unable to request scan."
    assert (
        f"User: {writer.id} tried to request a scan for test-domain-gc-ca but domain does not exist."
        in caplog.text
    )


def test_request_scan_mutation_user_read_cant_access(save, caplog):
    """
    Test to see proper error gets returned when a user read attempts to request scan
    """
    org_one = Organizations(
        acronym="ORG1",
        name="Organization 1",
        slug="organization-1",
        domains=[Domains(domain="test.domain.gc.ca", slug="test-domain-gc-ca")],
    )
    save(org_one)

    reader = Users(
        display_name="testreader",
        user_name="testreader@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org_one),
        ],
    )
    save(reader)

    caplog.set_level(logging.WARNING)
    result = run(
        mutation="""
        mutation {
            requestScan (
                input: {
                    scanType: WEB,
                    urlSlug: "test-domain-gc-ca"
                }
            ) {
                requestStatus
            }
        }
        """,
        as_user=reader,
    )

    if "errors" not in result:
        fail("Expected request scan error to occur, instead: {}".format(json(result)))

    [error] = result["errors"]
    assert error["message"] == "Error, unable to request scan."
    assert (
        f"User: {reader.id} tried to dispatch a scan for test-domain-gc-ca but does not have permissions to do so."
        in caplog.text
    )
