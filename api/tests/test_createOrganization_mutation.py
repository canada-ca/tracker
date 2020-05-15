import pytest

from pytest import fail
from graphene.test import Client

from app import app
from db import DB
from queries import schema
from json_web_token import tokenize, auth_header
from tests.test_functions import json, run
from models import (
    Organizations,
    Users,
    User_affiliations,
)


@pytest.fixture
def save():
    with app.app_context():
        s, cleanup, session = DB()
        yield s
        cleanup()


def test_mutation_createOrganization_fails_for_existing_orgs(save):
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
                acronym="SA",
                org_tags={"name": "SA"},
                name="Super Admin",
                slug="super-admin",
            ),
        )
    )

    save(sa_user)

    result = run(
        mutation="""
            mutation {
                created_org:createOrganization(
                    name: "Super Admin"
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
            "expected createOrganization to fail for an existing org. Instead: {}".format(
                json(result)
            )
        )


def test_mutation_createOrganization_as_super_user(save):
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

    result = run(
        mutation="""
        mutation {
            created_org:createOrganization(
                name: "Test Organization"
                acronym: "TEST_ORG"
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
            "expected createOrganization to succeed for super admin. Instead: {}".format(
                json(result)
            )
        )

    created_org = result["data"].values()
    [status] = created_org

    assert status == {"status": True}


def test_mutation_createOrganization_fails_for_write_users(save):
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

    result = run(
        mutation="""
         mutation {
             createOrganization(
                 acronym: "USER_W_NEW"
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
            "expected createOrganization to fail for user_write users. Instead: {}".format(
                json(result)
            )
        )

    errors, data = result.values()
    [first] = errors
    message, _, _ = first.values()
    assert message == "Error, you do not have permission to create organizations"


def test_mutation_createOrganization_fails_for_admin_users(save):
    admin = Users(
        display_name="admin", user_name="admin@example.com", password="testpassword123",
    )

    save(admin)

    result = run(
        mutation="""
         mutation {
             createOrganization(
                 name: "New thing"
                 acronym: "NEW"
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
    assert message == "Error, you do not have permission to create organizations"


def test_mutation_createOrganization_fails_for_read_users(save):
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
             createOrganization(
                 acronym: "USER_R_NEW"
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
    assert message == "Error, you do not have permission to create organizations"


def test_mutation_createOrganization_fails_for_admin_users(save):
    admin = Users(
        display_name="admin", user_name="admin@example.com", password="testpassword123",
    )

    save(admin)

    result = run(
        mutation="""
         mutation {
             createOrganization(
                 name: "New thing"
                 acronym: "NEW"
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
    assert message == "Error, you do not have permission to create organizations"
