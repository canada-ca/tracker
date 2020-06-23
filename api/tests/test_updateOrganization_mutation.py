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


def test_mutation_updateOrganization_succeeds_as_super_user(save):
    sa_user = Users(
        display_name="testsuperadmin",
        user_name="testsuperadmin@testemail.ca",
        password="testpassword123",
    )
    sa_user.user_affiliation.append(
        User_affiliations(
            permission="super_admin",
            user_organization=Organizations(acronym="SA", name="Super Admin"),
        )
    )
    sa_user.user_affiliation.append(
        User_affiliations(
            permission="super_admin",
            user_organization=Organizations(acronym="ORG1", name="Org One"),
        )
    )

    save(sa_user)

    result = run(
        mutation="""
        mutation {
            updateOrganization(
                slug: "org-one"
                name: "Org One"
                acronym: "O1"
                zone: "Test Zone"
                sector: "Test Sector"
                province: "Nova Scotia"
                city: "Halifax"
            ) {
                status
            }
        }
        """,
        as_user=sa_user,
    )

    if "errors" in result:
        fail(
            "expected updateOrganization to succeed for super admin. Instead: {}".format(
                json(result)
            )
        )

    created_org = result["data"].values()
    [status] = created_org

    assert status == {"status": True}


def test_mutation_updateOrganization_fails_if_names_clash(save):
    sa_user = Users(
        display_name="testsuperadmin",
        user_name="testsuperadmin@testemail.ca",
        password="testpassword123",
    )
    sa_user.user_affiliation.append(
        User_affiliations(
            permission="super_admin",
            user_organization=Organizations(acronym="SA", name="Super Admin"),
        )
    )
    sa_user.user_affiliation.append(
        User_affiliations(
            permission="super_admin",
            user_organization=Organizations(acronym="ORG1", name="Org One"),
        )
    )

    save(sa_user)

    result = run(
        mutation="""
         mutation {
             updateOrganization(
                 slug: "super-admin"
                 name: "Org One"
                 acronym: "SA"
                 zone: "Test Zone"
                 sector: "Test Sector"
                 province: "Nova Scotia"
                 city: "Halifax"
             ) {
                 status
             }
         }
        """,
        as_user=sa_user,
    )

    if "errors" not in result:
        fail(
            "expected updateOrganization to fail when renaming clashes. Instead: {}".format(
                json(result)
            )
        )

    errors, data = result.values()
    [first] = errors
    message, _, _ = first.values()
    assert message == "Error, unable to update organization."


def test_mutation_updateOrganization_fails_if_org_does_not_exist(save):
    sa_user = Users(
        display_name="testsuperadmin",
        user_name="testsuperadmin@testemail.ca",
        password="testpassword123",
    )
    sa_user.user_affiliation.append(
        User_affiliations(
            permission="super_admin",
            user_organization=Organizations(acronym="SA", name="Super Admin"),
        )
    )

    save(sa_user)

    result = run(
        mutation="""
         mutation {
             updateOrganization(
                 slug: "org-one"
                 name: "Org One"
                 acronym: "O1"
                 zone: "Test Zone"
                 sector: "Test Sector"
                 province: "Nova Scotia"
                 city: "Halifax"
             ) {
                 status
             }
         }
        """,
        as_user=sa_user,
    )

    if "errors" not in result:
        fail(
            "expected updateOrganization to fail for orgs that don't exist. Instead: {}".format(
                json(result)
            )
        )

    errors, data = result.values()
    [first] = errors
    message, _, _ = first.values()
    assert message == "Error, unable to update organization."


def test_mutation_updateOrganization_fails_for_admin_users(save):
    admin = Users(
        display_name="admin", user_name="admin@example.com", password="testpassword123",
    )

    admin.user_affiliation.append(
        User_affiliations(
            permission="admin",
            user_organization=Organizations(acronym="ORG1", name="Org One"),
        )
    )

    save(admin)

    result = run(
        mutation="""
         mutation {
             updateOrganization(
                 slug: "org-one"
                 acronym: "O1"
                 name: "Test Organization"
                 zone: "Test Zone"
                 sector: "Test Sector"
                 province: "Nova Scotia"
                 city: "Halifax"
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
    assert message == "Error, unable to update organization."


def test_mutation_updateOrganization_fails_for_write_users(save):
    write_user = Users(
        display_name="writer",
        user_name="write_user@example.com",
        password="testpassword123",
    )

    write_user.user_affiliation.append(
        User_affiliations(
            permission="user_write",
            user_organization=Organizations(acronym="ORG1", name="Org One"),
        )
    )

    save(write_user)

    result = run(
        mutation="""
         mutation {
             updateOrganization(
                 slug: "org-one"
                 acronym: "O1"
                 name: "Test Organization"
                 zone: "Test Zone"
                 sector: "Test Sector"
                 province: "Nova Scotia"
                 city: "Halifax"
             ) {
                 status
             }
         }
        """,
        as_user=write_user,
    )

    if "errors" not in result:
        fail(
            "expected createOrganization to fail for write users. Instead: {}".format(
                json(result)
            )
        )

    errors, data = result.values()
    [first] = errors
    message, _, _ = first.values()
    assert message == "Error, unable to update organization."


def test_mutation_updateOrganization_fails_for_read_users(save):
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

    result = run(
        mutation="""
         mutation {
             updateOrganization(
                 slug: "org-one"
                 acronym: "O1"
                 name: "Test Organization"
                 zone: "Test Zone"
                 sector: "Test Sector"
                 province: "Nova Scotia"
                 city: "Halifax"
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
    assert message == "Error, unable to update organization."
