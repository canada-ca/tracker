import pytest
from pytest import fail

from models import Users, User_affiliations, Organizations
from db import DB
from tests.test_functions import json, run


@pytest.fixture
def save():
    s, cleanup, session = DB()
    yield s
    cleanup()


def test_testUserClaims_accepts_admin_claim_for_admin_user(save):
    # create a user.
    # This user is admin by default in their own "user" org
    user = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
    )

    # Assign read permission to Org1
    user.user_affiliation.append(
        User_affiliations(
            permission="admin",
            user_organization=Organizations(acronym="ORG1", name="Organization 1"),
        )
    )

    save(user)

    result = run(
        query="""
            {
                testUserClaims(orgSlug: "organization-1", role: ADMIN)
            }
        """,
        as_user=user,
    )
    if "errors" in result:
        fail("expected admin's ADMIN check to pass but got: {}".format(json(result)))

    [testUserClaims] = result["data"].values()
    assert testUserClaims == "User Passed Admin Claim"


def test_testUserClaims_accepts_write_claim_for_write_user(save):
    # create a user.
    # This user is admin by default in their own "user" org
    user = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
    )

    # Assign read permission to Org1
    user.user_affiliation.append(
        User_affiliations(
            permission="user_write",
            user_organization=Organizations(acronym="ORG1", name="Organization 1"),
        )
    )

    save(user)
    result = run(
        query="""
            {
                testUserClaims(orgSlug: "organization-1", role: USER_WRITE)
            }
        """,
        as_user=user,
    )
    if "errors" in result:
        fail(
            "expected write user's USER_WRITE check to pass but got: {}".format(
                json(result)
            )
        )

    [testUserClaims] = result["data"].values()
    assert testUserClaims == "User Passed User Write Claim"


def test_testUserClaims_accepts_super_admin_claim_for_super_admin(save):
    # create a user.
    # This user is admin by default in their own "user" org
    user = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
    )

    # Assign read permission to Org1
    user.user_affiliation.append(
        User_affiliations(
            permission="super_admin",
            user_organization=Organizations(acronym="ORG1", name="Organization 1"),
        )
    )

    save(user)
    result = run(
        query="""
            {
                testUserClaims(orgSlug: "organization-1", role: SUPER_ADMIN)
            }
        """,
        as_user=user,
    )

    if "errors" in result:
        fail(
            "expected super admin's SUPER_ADMIN check to pass but got: {}".format(
                json(result)
            )
        )

    [testUserClaims] = result["data"].values()
    assert testUserClaims == "User Passed Super Admin Claim"


def test_testUserClaims_accepts_read_claim_for_read_user(save):
    # create a user.
    # This user is admin by default in their own "user" org
    user = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
    )

    # Assign read permission to Org1
    user.user_affiliation.append(
        User_affiliations(
            permission="user_read",
            user_organization=Organizations(acronym="ORG1", name="Organization 1"),
        )
    )

    save(user)

    result = run(
        query="""
            {
                testUserClaims(orgSlug: "organization-1", role: USER_READ)
            }
        """,
        as_user=user,
    )

    if "errors" in result:
        fail(
            "expected read user's USER_READ check to pass but got: {}".format(
                json(result)
            )
        )

    [testUserClaims] = result["data"].values()
    assert testUserClaims == "User Passed User Read Claim"


def test_testUserClaims_rejects_super_admin_check_for_read_user(save):
    # create a user.
    # This user is admin by default in their own "user" org
    user = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
    )

    # Assign read permission to Org1
    user.user_affiliation.append(
        User_affiliations(
            permission="user_read",
            user_organization=Organizations(acronym="ORG1", name="Organization 1"),
        )
    )

    save(user)

    result = run(
        query="""
            {
                testUserClaims(orgSlug: "organization-1", role: SUPER_ADMIN)
            }
        """,
        as_user=user,
    )

    if "errors" not in result:
        fail(
            "expected read user to be rejected as super admin but got: {}".format(
                json(result)
            )
        )

    errors, data = result.values()
    [first] = errors
    message, _, _ = first.values()
    assert message == "Error, user is not a super admin"


def test_testUserClaims_rejects_admin_check_for_read_user(save):
    # create a user.
    # This user is admin by default in their own "user" org
    user = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
    )

    # Assign read permission to Org1
    user.user_affiliation.append(
        User_affiliations(
            permission="user_read",
            user_organization=Organizations(acronym="ORG1", name="Organization 1"),
        )
    )

    save(user)

    result = run(
        query="""
            {
                testUserClaims(orgSlug: "organization-1", role: ADMIN)
            }
        """,
        as_user=user,
    )
    if "errors" not in result:
        fail(
            "expected read user claiming admin to error but got: {}".format(
                json(result)
            )
        )

    errors, data = result.values()
    [first] = errors
    message, _, _ = first.values()
    assert message == "Error, user is not an admin for that org"


def test_testUserClaims_rejects_super_admin_check_for_admin_user(save):
    # create a user.
    # This user is admin by default in their own "user" org
    user = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
    )

    # Assign read permission to Org1
    user.user_affiliation.append(
        User_affiliations(
            permission="admin",
            user_organization=Organizations(acronym="ORG1", name="Organization 1"),
        )
    )

    save(user)

    result = run(
        query="""
            {
                testUserClaims(orgSlug: "organization-1", role: SUPER_ADMIN)
            }
        """,
        as_user=user,
    )

    if "errors" not in result:
        fail(
            "expected admin claiming super admin to error but got: {}".format(
                json(result)
            )
        )

    errors, data = result.values()
    [first] = errors
    message, _, _ = first.values()
    assert message == "Error, user is not a super admin"


def test_testUserClaims_rejects_super_admin_check_for_write_user(save):
    # create a user.
    # This user is admin by default in their own "user" org
    user = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
    )

    # Assign read permission to Org1
    user.user_affiliation.append(
        User_affiliations(
            permission="user_write",
            user_organization=Organizations(acronym="ORG1", name="Organization 1"),
        )
    )

    save(user)

    result = run(
        query="""
            {
                testUserClaims(orgSlug: "organization-1", role: SUPER_ADMIN)
            }
        """,
        as_user=user,
    )

    if "errors" not in result:
        fail(
            "expected write user claiming super admin to error but got: {}".format(
                json(result)
            )
        )

    errors, data = result.values()
    [first] = errors
    message, _, _ = first.values()
    assert message == "Error, user is not a super admin"
