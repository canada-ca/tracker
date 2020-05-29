import pytest
from pytest import fail
from db import DB
from models import Users, User_affiliations, Organizations
from functions.error_messages import error_not_an_admin
from tests.test_functions import json, run


@pytest.fixture
def db():
    save, cleanup, session = DB()
    yield [save, session]
    cleanup()


def test_sa_user_can_use_updateUserRole_to_switch_user_from_read_to_write(db):
    [save, _] = db
    org1 = Organizations(acronym="ORG1", name="Organization 1")
    super_admin = Users(
        display_name="testsuperadmin",
        user_name="testsuperadmin@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org1, permission="super_admin")
        ],
    )
    save(super_admin)

    # User with read permission
    user = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org1, permission="user_read")
        ],
    )
    save(user)

    update_result = run(
        mutation="""
        mutation {
            updateUserRole(
              orgSlug: "organization-1"
              role: USER_WRITE
              userName:"testuserread@testemail.ca"
            ){
              status
          }
        }
        """,
        as_user=super_admin,
    )
    if "errors" in update_result:
        fail(
            "Super admin failed when trying to update user permissions! :"
            "{}".format(json(update_result))
        )

    actual = run(
        query="""
        {
            response:testUserClaims(orgSlug: "organization-1", role: USER_WRITE)
        }
        """,
        as_user=user,
    )

    [response] = actual["data"].values()
    assert response == "User Passed User Write Claim"


def test_sa_user_can_use_updateUserRole_to_switch_user_from_read_to_admin(db):
    [save, _] = db
    org1 = Organizations(acronym="ORG1", name="Organization 1")
    super_admin = Users(
        display_name="testsuperadmin",
        user_name="testsuperadmin@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org1, permission="super_admin")
        ],
    )
    save(super_admin)

    # User with read permission
    user = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org1, permission="user_read")
        ],
    )
    save(user)

    update_result = run(
        mutation="""
        mutation {
            updateUserRole(
              orgSlug: "organization-1"
              role: ADMIN
              userName:"testuserread@testemail.ca"
            ){
              status
          }
        }
        """,
        as_user=super_admin,
    )
    if "errors" in update_result:
        fail(
            "Super admin failed when trying to update user permissions! :"
            "{}".format(json(update_result))
        )

    actual = run(
        query="""
        {
            response:testUserClaims(orgSlug: "organization-1", role: ADMIN)
        }
        """,
        as_user=user,
    )

    [response] = actual["data"].values()
    assert response == "User Passed Admin Claim"


def test_sa_user_can_use_updateUserRole_annoint_another_user_a_sa(db):
    [save, _] = db
    org1 = Organizations(acronym="ORG1", name="Organization 1")
    super_admin = Users(
        display_name="testsuperadmin",
        user_name="testsuperadmin@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org1, permission="super_admin")
        ],
    )
    save(super_admin)

    # User with read permission
    user = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org1, permission="user_read")
        ],
    )
    save(user)

    update_result = run(
        mutation="""
        mutation {
            updateUserRole(
              orgSlug: "organization-1"
              role: SUPER_ADMIN
              userName:"testuserread@testemail.ca"
            ){
              status
          }
        }
        """,
        as_user=super_admin,
    )
    if "errors" in update_result:
        fail(
            "Super admin failed when trying to update user permissions! :"
            "{}".format(json(update_result))
        )

    actual = run(
        query="""
        {
            response:testUserClaims(orgSlug: "organization-1", role: SUPER_ADMIN)
        }
        """,
        as_user=user,
    )

    [response] = actual["data"].values()
    assert response == "User Passed Super Admin Claim"


def test_read_user_cannot_update_their_own_permissions(db):
    [save, _] = db
    # User with read permission
    user = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(
                user_organization=Organizations(acronym="ORG1", name="Organization 1"),
                permission="user_read",
            )
        ],
    )
    save(user)

    response = run(
        mutation="""
        mutation {
          updateUserRole(
            orgSlug: "organization-1"
            role: ADMIN
            userName:"testsuperadmin@testemail.ca"
          ){
            status
          }
        }
        """,
        as_user=user,
    )
    if "errors" not in response:
        fail(
            "expected a user changing their own permissions to fail. Instead: "
            "{}".format(json(response))
        )
    [err] = response["errors"]
    print(err)
    [message, _locations, _path] = err.values()
    assert message == error_not_an_admin()
