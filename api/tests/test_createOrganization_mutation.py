import logging
import pytest

from pytest import fail

from db import DB
from models import (
    Organizations,
    Users,
    User_affiliations,
)
from tests.test_functions import json, run


@pytest.fixture
def save():
    s, cleanup, session = DB()
    yield s
    cleanup()


def test_mutation_createOrganization_as_super_user(save, caplog):
    """
    Test To See If SA Can Create Organization
    """
    sa_user = Users(
        display_name="testsuperadmin",
        user_name="testsuperadmin@testemail.ca",
        password="testpassword123",
    )
    sa_user.user_affiliation.append(
        User_affiliations(
            permission="super_admin",
            user_organization=Organizations(
                acronym="SA", org_tags={"name": "SA"}, name="Super Admin"
            ),
        )
    )

    save(sa_user)

    caplog.set_level(logging.INFO)
    result = run(
        mutation="""
        mutation {
            created_org:createOrganization(
                input: {
                    name: "Test Organization"
                    acronym: "TEST_ORG"
                    zone: "Test Zone"
                    sector: "Test Sector"
                    province: "Nova Scotia"
                    city: "Halifax"
                }
            ) {
                status
            }
        }
        """,
        as_user=sa_user,
    )

    if "errors" in result:
        fail(
            "expected createOrganization to succeed for super admin. Instead: {}".format(
                json(result)
            )
        )

    created_org = result["data"].values()
    [status] = created_org

    assert status == {"status": True}
    assert (
        f"Super admin: {sa_user.id} successfully created a new org: test-organization."
        in caplog.text
    )


def test_mutation_createOrganization_fails_for_existing_orgs(save, caplog):
    """
    Test to ensure that if an org already exists it won't be recreated
    """
    sa_user = Users(
        display_name="testsuperadmin",
        user_name="testsuperadmin@testemail.ca",
        password="testpassword123",
    )
    sa_user.user_affiliation.append(
        User_affiliations(
            permission="super_admin",
            user_organization=Organizations(
                acronym="SA",
                org_tags={"name": "SA"},
                name="Super Admin",
                slug="super-admin",
            ),
        )
    )

    save(sa_user)

    caplog.set_level(logging.WARNING)
    result = run(
        mutation="""
            mutation {
                created_org:createOrganization(
                    input: {
                        name: "Super Admin"
                        acronym: "SA"
                        zone: "Test Zone"
                        sector: "Test Sector"
                        province: "Nova Scotia"
                        city: "Halifax"
                    }
                ) {
                    status
                }
            }
        """,
        as_user=sa_user,
    )

    if "errors" not in result:
        fail(
            "expected createOrganization to fail for an existing org. Instead: {}".format(
                json(result)
            )
        )

    errors, data = result.values()
    [first] = errors
    message, _, _ = first.values()
    assert message == "Error, unable to create organization."
    assert (
        f"Super admin: {sa_user.id} tried to create an organization, but it already exists."
        in caplog.text
    )


def test_mutation_createOrganization_fails_for_admin_users(save, caplog):
    """
    Test to ensure that admins are not able to create organizations
    """

    admin = Users(
        display_name="admin", user_name="admin@example.com", password="testpassword123",
    )

    save(admin)

    caplog.set_level(logging.WARNING)
    result = run(
        mutation="""
         mutation {
             createOrganization(
                input: {
                    name: "New thing"
                    acronym: "NEW"
                    zone: "Test Zone"
                    sector: "Test Sector"
                    province: "Nova Scotia"
                    city: "Halifax"
                }
             ) {
                 status
             }
         }
        """,
        as_user=admin,
    )

    if "errors" not in result:
        fail(
            "expected createOrganization to fail for admins. Instead: {}".format(
                json(result)
            )
        )

    errors, data = result.values()
    [first] = errors
    message, _, _ = first.values()
    assert message == "Error, unable to create organization."
    assert (
        f"User: {admin.id} tried to create a new organization, but is not a super admin."
        in caplog.text
    )


def test_mutation_createOrganization_fails_for_write_users(save, caplog):
    """
    Test to ensure that user write are not able to create organizations
    """

    write_user = Users(
        display_name="writer",
        user_name="writer@example.com",
        password="testpassword123",
    )

    write_user.user_affiliation.append(
        User_affiliations(
            permission="user_write",
            user_organization=Organizations(acronym="ORG1", name="Org One"),
        )
    )

    save(write_user)

    caplog.set_level(logging.WARNING)
    result = run(
        mutation="""
         mutation {
             createOrganization(
                 input: {
                     acronym: "USER_W_NEW"
                     name: "Test Organization"
                     zone: "Test Zone"
                     sector: "Test Sector"
                     province: "Nova Scotia"
                     city: "Halifax"
                 }
             ) {
                 status
             }
         }
        """,
        as_user=write_user,
    )

    if "errors" not in result:
        fail(
            "expected createOrganization to fail for user_write users. Instead: {}".format(
                json(result)
            )
        )

    errors, data = result.values()
    [first] = errors
    message, _, _ = first.values()
    assert message == "Error, unable to create organization."
    assert (
        f"User: {write_user.id} tried to create a new organization, but is not a super admin."
        in caplog.text
    )


def test_mutation_createOrganization_fails_for_read_users(save, caplog):
    """
    Test to ensure that user read are not able to create organizations
    """

    reader = Users(
        display_name="reader",
        user_name="reader@example.com",
        password="testpassword123",
    )

    reader.user_affiliation.append(
        User_affiliations(
            permission="user_read",
            user_organization=Organizations(acronym="ORG1", name="Org One"),
        )
    )

    save(reader)

    caplog.set_level(logging.WARNING)
    result = run(
        mutation="""
         mutation {
             createOrganization(
                 input: {
                     acronym: "USER_R_NEW"
                     name: "Test Organization"
                     zone: "Test Zone"
                     sector: "Test Sector"
                     province: "Nova Scotia"
                     city: "Halifax"
                 }
             ) {
                 status
             }
         }
        """,
        as_user=reader,
    )

    if "errors" not in result:
        fail(
            "expected createOrganization to fail for read users. Instead: {}".format(
                json(result)
            )
        )

    errors, data = result.values()
    [first] = errors
    message, _, _ = first.values()
    assert message == "Error, unable to create organization."
    assert (
        f"User: {reader.id} tried to create a new organization, but is not a super admin."
        in caplog.text
    )
