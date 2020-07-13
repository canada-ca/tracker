import logging
import pytest

from pytest import fail
from db import DB
from models import Organizations, User_affiliations, Users
from tests.test_functions import run, json


@pytest.fixture
def db():
    s, cleanup, session = DB()
    yield s, session
    cleanup()


def test_sa_can_update_user_role_to_super_admin(db, caplog):
    """
    Test to see that user can be updated to super admin by super admin
    """
    save, session = db

    super_admin_org = Organizations(
        acronym="SA", name="Super Admin", slug="super-admin"
    )
    save(super_admin_org)

    super_admin = Users(
        display_name="testsuperadmin",
        user_name="testsuperadmin@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(
                permission="super_admin", user_organization=super_admin_org
            ),
        ],
    )
    save(super_admin)

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(
                permission="user_read", user_organization=super_admin_org
            ),
        ],
    )
    save(user)

    caplog.set_level(logging.INFO)
    result = run(
        mutation="""
        mutation {
            updateUserRole (
                input: {
                    userName: "testuser@testemail.ca"
                    orgSlug: "super-admin"
                    role: SUPER_ADMIN
                }
            ) {
                status
            }
        }
        """,
        as_user=super_admin,
    )

    if "errors" in result:
        fail(f"Expected to update user role to super admin, instead: {json(result)}")

    expected_result = {
        "data": {
            "updateUserRole": {"status": "User role has been successfully updated."}
        }
    }

    assert result == expected_result
    assert (
        f"User: {super_admin.id} successfully updated {user.id}'s role to super_admin."
    )

    user_aff = (
        session.query(User_affiliations)
        .filter(User_affiliations.user_id == user.id)
        .filter(User_affiliations.organization_id == super_admin_org.id)
        .first()
    )
    assert user_aff.permission == "super_admin"


def test_sa_cant_update_user_role_to_super_admin_when_user_doesnt_belong_to_sa_org(
    db, caplog
):
    """
    Test to make sure that a user cannot be updated to super admin if they
    don't belong to that org
    """
    save, session = db

    super_admin_org = Organizations(
        acronym="SA", name="Super Admin", slug="super-admin"
    )
    save(super_admin_org)

    org_one = Organizations(acronym="ORG1", name="Org One", slug="org-one")
    save(org_one)

    super_admin = Users(
        display_name="testsuperadmin",
        user_name="testsuperadmin@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(
                permission="super_admin", user_organization=super_admin_org
            ),
        ],
    )
    save(super_admin)

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org_one),
        ],
    )
    save(user)

    caplog.set_level(logging.INFO)
    result = run(
        mutation="""
        mutation {
            updateUserRole (
                input: {
                    userName: "testuser@testemail.ca"
                    orgSlug: "super-admin"
                    role: SUPER_ADMIN
                }
            ) {
                status
            }
        }
        """,
        as_user=super_admin,
    )

    if "errors" not in result:
        fail(
            f"Expected to fail, because user doesn't belong to super admin org, instead: {json(result)}"
        )

    [error] = result["errors"]
    assert error["message"] == "Error, unable to update user role."
    assert f"User: {super_admin.id} attempted to update {user.id}'s role, but they do not have the permission to {super_admin_org.id}."


def test_admin_cant_update_user_role_to_super_admin_when_user_doesnt_belong_to_sa_org(
    db, caplog
):
    """
    Test to make sure that an admin cant update a role to super admin
    """
    save, session = db

    org_one = Organizations(acronym="ORG1", name="Org One", slug="org-one")
    save(org_one)

    admin = Users(
        display_name="testadmin",
        user_name="testadmin@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="admin", user_organization=org_one),
        ],
    )
    save(admin)

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org_one),
        ],
    )
    save(user)

    caplog.set_level(logging.INFO)
    result = run(
        mutation="""
        mutation {
            updateUserRole (
                input: {
                    userName: "testuser@testemail.ca"
                    orgSlug: "super-admin"
                    role: SUPER_ADMIN
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
            f"Expected to fail, because requesting user does not have super admin rights, instead: {json(result)}"
        )

    [error] = result["errors"]
    assert error["message"] == "Error, unable to update user role."
    assert f"User: {admin.id} attempted to update {user.id}'s role, but they do not have the permission to {org_one.id}."


def test_user_write_cant_update_user_role_to_super_admin_when_user_doesnt_belong_to_sa_org(
    db, caplog
):
    """
    Test to make sure that an user write cant update a role to super admin
    """
    save, session = db

    org_one = Organizations(acronym="ORG1", name="Org One", slug="org-one")
    save(org_one)

    user_write = Users(
        display_name="testuserwrite",
        user_name="testuserwrite@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="admin", user_organization=org_one),
        ],
    )
    save(user_write)

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org_one),
        ],
    )
    save(user)

    caplog.set_level(logging.INFO)
    result = run(
        mutation="""
        mutation {
            updateUserRole (
                input: {
                    userName: "testuser@testemail.ca"
                    orgSlug: "super-admin"
                    role: SUPER_ADMIN
                }
            ) {
                status
            }
        }
        """,
        as_user=user_write,
    )

    if "errors" not in result:
        fail(
            f"Expected to fail, because requesting user does not have super admin rights, instead: {json(result)}"
        )

    [error] = result["errors"]
    assert error["message"] == "Error, unable to update user role."
    assert f"User: {user_write.id} attempted to update {user.id}'s role, but they do not have the permission to {org_one.id}."


def test_user_read_cant_update_user_role_to_super_admin_when_user_doesnt_belong_to_sa_org(
    db, caplog
):
    """
    Test to make sure that an user write cant update a role to super admin
    """
    save, session = db

    org_one = Organizations(acronym="ORG1", name="Org One", slug="org-one")
    save(org_one)

    user_read = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="admin", user_organization=org_one),
        ],
    )
    save(user_read)

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org_one),
        ],
    )
    save(user)

    caplog.set_level(logging.INFO)
    result = run(
        mutation="""
        mutation {
            updateUserRole (
                input: {
                    userName: "testuser@testemail.ca"
                    orgSlug: "super-admin"
                    role: SUPER_ADMIN
                }
            ) {
                status
            }
        }
        """,
        as_user=user_read,
    )

    if "errors" not in result:
        fail(
            f"Expected to fail, because requesting user does not have super admin rights, instead: {json(result)}"
        )

    [error] = result["errors"]
    assert error["message"] == "Error, unable to update user role."
    assert f"User: {user_read.id} attempted to update {user.id}'s role, but they do not have the permission to {org_one.id}."


def test_sa_can_update_user_role_to_admin(db, caplog):
    """
    Test to see that a super admin can update user role to admin in a different
    organization
    """
    save, session = db

    super_admin_org = Organizations(
        acronym="SA", name="Super Admin", slug="super-admin"
    )
    save(super_admin_org)

    org_one = Organizations(acronym="ORG1", name="Org One", slug="org-one")
    save(org_one)

    super_admin = Users(
        display_name="testsuperadmin",
        user_name="testsuperadmin@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(
                permission="super_admin", user_organization=super_admin_org
            ),
        ],
    )
    save(super_admin)

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org_one),
        ],
    )
    save(user)

    caplog.set_level(logging.INFO)
    result = run(
        mutation="""
        mutation {
            updateUserRole (
                input: {
                    userName: "testuser@testemail.ca"
                    orgSlug: "org-one"
                    role: ADMIN
                }
            ) {
                status
            }
        }
        """,
        as_user=super_admin,
    )

    if "errors" in result:
        fail(f"Expected to update user role to admin, instead: {json(result)}")

    expected_result = {
        "data": {
            "updateUserRole": {"status": "User role has been successfully updated."}
        }
    }

    assert result == expected_result
    assert f"User: {super_admin.id} successfully updated {user.id}'s role to admin."

    user_aff = (
        session.query(User_affiliations)
        .filter(User_affiliations.user_id == user.id)
        .filter(User_affiliations.organization_id == org_one.id)
        .first()
    )
    assert user_aff.permission == "admin"


def test_sa_can_update_user_role_to_user_write(db, caplog):
    """
    Test to see that a super admin can update user role to user write in a
    different organization
    """
    save, session = db

    super_admin_org = Organizations(
        acronym="SA", name="Super Admin", slug="super-admin"
    )
    save(super_admin_org)

    org_one = Organizations(acronym="ORG1", name="Org One", slug="org-one")
    save(org_one)

    super_admin = Users(
        display_name="testsuperadmin",
        user_name="testsuperadmin@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(
                permission="super_admin", user_organization=super_admin_org
            ),
        ],
    )
    save(super_admin)

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org_one),
        ],
    )
    save(user)

    caplog.set_level(logging.INFO)
    result = run(
        mutation="""
        mutation {
            updateUserRole (
                input: {
                    userName: "testuser@testemail.ca"
                    orgSlug: "org-one"
                    role: USER_WRITE
                }
            ) {
                status
            }
        }
        """,
        as_user=super_admin,
    )

    if "errors" in result:
        fail(f"Expected to update user role to admin, instead: {json(result)}")

    expected_result = {
        "data": {
            "updateUserRole": {"status": "User role has been successfully updated."}
        }
    }

    assert result == expected_result
    assert f"User: {super_admin.id} successfully updated {user.id}'s role to admin."

    user_aff = (
        session.query(User_affiliations)
        .filter(User_affiliations.user_id == user.id)
        .filter(User_affiliations.organization_id == org_one.id)
        .first()
    )
    assert user_aff.permission == "user_write"


def test_sa_can_update_user_role_to_user_read(db, caplog):
    """
    Test to see that a super admin can update user role to user read in a
    different organization
    """
    save, session = db

    super_admin_org = Organizations(
        acronym="SA", name="Super Admin", slug="super-admin"
    )
    save(super_admin_org)

    org_one = Organizations(acronym="ORG1", name="Org One", slug="org-one")
    save(org_one)

    super_admin = Users(
        display_name="testsuperadmin",
        user_name="testsuperadmin@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(
                permission="super_admin", user_organization=super_admin_org
            ),
        ],
    )
    save(super_admin)

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="user_write", user_organization=org_one),
        ],
    )
    save(user)

    caplog.set_level(logging.INFO)
    result = run(
        mutation="""
        mutation {
            updateUserRole (
                input: {
                    userName: "testuser@testemail.ca"
                    orgSlug: "org-one"
                    role: USER_READ
                }
            ) {
                status
            }
        }
        """,
        as_user=super_admin,
    )

    if "errors" in result:
        fail(f"Expected to update user role to admin, instead: {json(result)}")

    expected_result = {
        "data": {
            "updateUserRole": {"status": "User role has been successfully updated."}
        }
    }

    assert result == expected_result
    assert f"User: {super_admin.id} successfully updated {user.id}'s role to admin."

    user_aff = (
        session.query(User_affiliations)
        .filter(User_affiliations.user_id == user.id)
        .filter(User_affiliations.organization_id == org_one.id)
        .first()
    )
    assert user_aff.permission == "user_read"


def test_admin_can_update_user_role_to_admin(db, caplog):
    """
    Test to see that a admin can update user role to admin in the same
    organization
    """
    save, session = db

    org_one = Organizations(acronym="ORG1", name="Org One", slug="org-one")
    save(org_one)

    admin = Users(
        display_name="testadmin",
        user_name="testadmin@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="admin", user_organization=org_one),
        ],
    )
    save(admin)

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org_one),
        ],
    )
    save(user)

    caplog.set_level(logging.INFO)
    result = run(
        mutation="""
        mutation {
            updateUserRole (
                input: {
                    userName: "testuser@testemail.ca"
                    orgSlug: "org-one"
                    role: ADMIN
                }
            ) {
                status
            }
        }
        """,
        as_user=admin,
    )

    if "errors" in result:
        fail(f"Expected to update user role to admin, instead: {json(result)}")

    expected_result = {
        "data": {
            "updateUserRole": {"status": "User role has been successfully updated."}
        }
    }

    assert result == expected_result
    assert f"User: {admin.id} successfully updated {user.id}'s role to admin."

    user_aff = (
        session.query(User_affiliations)
        .filter(User_affiliations.user_id == user.id)
        .filter(User_affiliations.organization_id == org_one.id)
        .first()
    )
    assert user_aff.permission == "admin"


def test_admin_can_update_user_role_to_user_write(db, caplog):
    """
    Test to see that a admin can update user role to user write in the same
    organization
    """
    save, session = db

    org_one = Organizations(acronym="ORG1", name="Org One", slug="org-one")
    save(org_one)

    admin = Users(
        display_name="testadmin",
        user_name="testadmin@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="admin", user_organization=org_one),
        ],
    )
    save(admin)

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org_one),
        ],
    )
    save(user)

    caplog.set_level(logging.INFO)
    result = run(
        mutation="""
        mutation {
            updateUserRole (
                input: {
                    userName: "testuser@testemail.ca"
                    orgSlug: "org-one"
                    role: USER_WRITE
                }
            ) {
                status
            }
        }
        """,
        as_user=admin,
    )

    if "errors" in result:
        fail(f"Expected to update user role to admin, instead: {json(result)}")

    expected_result = {
        "data": {
            "updateUserRole": {"status": "User role has been successfully updated."}
        }
    }

    assert result == expected_result
    assert f"User: {admin.id} successfully updated {user.id}'s role to admin."

    user_aff = (
        session.query(User_affiliations)
        .filter(User_affiliations.user_id == user.id)
        .filter(User_affiliations.organization_id == org_one.id)
        .first()
    )
    assert user_aff.permission == "user_write"


def test_admin_can_update_user_role_to_user_read(db, caplog):
    """
    Test to see that a admin can update user role to user read in the same
    organization
    """
    save, session = db

    org_one = Organizations(acronym="ORG1", name="Org One", slug="org-one")
    save(org_one)

    admin = Users(
        display_name="testadmin",
        user_name="testadmin@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="admin", user_organization=org_one),
        ],
    )
    save(admin)

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="user_write", user_organization=org_one),
        ],
    )
    save(user)

    caplog.set_level(logging.INFO)
    result = run(
        mutation="""
        mutation {
            updateUserRole (
                input: {
                    userName: "testuser@testemail.ca"
                    orgSlug: "org-one"
                    role: USER_READ
                }
            ) {
                status
            }
        }
        """,
        as_user=admin,
    )

    if "errors" in result:
        fail(f"Expected to update user role to admin, instead: {json(result)}")

    expected_result = {
        "data": {
            "updateUserRole": {"status": "User role has been successfully updated."}
        }
    }

    assert result == expected_result
    assert f"User: {admin.id} successfully updated {user.id}'s role to admin."

    user_aff = (
        session.query(User_affiliations)
        .filter(User_affiliations.user_id == user.id)
        .filter(User_affiliations.organization_id == org_one.id)
        .first()
    )
    assert user_aff.permission == "user_read"


def test_admin_cant_update_user_role_to_user_outside_of_admin_org(db, caplog):
    """
    Test to make sure that admin cant update a user outside of their org
    """
    save, session = db

    org_one = Organizations(acronym="ORG1", name="Org One", slug="org-one")
    save(org_one)

    org_two = Organizations(acronym="ORG2", name="Org Two", slug="org-two")
    save(org_two)

    admin = Users(
        display_name="testadmin",
        user_name="testadmin@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="admin", user_organization=org_one),
        ],
    )
    save(admin)

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org_two),
        ],
    )
    save(user)

    caplog.set_level(logging.INFO)
    result = run(
        mutation="""
        mutation {
            updateUserRole (
                input: {
                    userName: "testuser@testemail.ca"
                    orgSlug: "super-admin"
                    role: SUPER_ADMIN
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
            f"Expected to fail, because requesting user does not have super admin rights, instead: {json(result)}"
        )

    [error] = result["errors"]
    assert error["message"] == "Error, unable to update user role."
    assert f"User: {admin.id} attempted to update {user.id}'s role, but they do not have the permission to {org_one.id}."


def test_user_write_cant_update_role(db, caplog):
    """
    Test to make sure that user write cant update a users role
    """
    save, session = db

    org_one = Organizations(acronym="ORG1", name="Org One", slug="org-one")
    save(org_one)

    user_write = Users(
        display_name="testuserwrite",
        user_name="testuserwrite@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="user_write", user_organization=org_one),
        ],
    )
    save(user_write)

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org_one),
        ],
    )
    save(user)

    caplog.set_level(logging.INFO)
    result = run(
        mutation="""
        mutation {
            updateUserRole (
                input: {
                    userName: "testuser@testemail.ca"
                    orgSlug: "super-admin"
                    role: SUPER_ADMIN
                }
            ) {
                status
            }
        }
        """,
        as_user=user_write,
    )

    if "errors" not in result:
        fail(
            f"Expected to fail, because requesting user does not have super admin rights, instead: {json(result)}"
        )

    [error] = result["errors"]
    assert error["message"] == "Error, unable to update user role."
    assert f"User: {user_write.id} attempted to update {user.id}'s role, but they do not have the permission to {org_one.id}."


def test_user_read_cant_update_role(db, caplog):
    """
    Test to make sure that user read cant update a users role
    """
    save, session = db

    org_one = Organizations(acronym="ORG1", name="Org One", slug="org-one")
    save(org_one)

    user_read = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org_one),
        ],
    )
    save(user_read)

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org_one),
        ],
    )
    save(user)

    caplog.set_level(logging.INFO)
    result = run(
        mutation="""
        mutation {
            updateUserRole (
                input: {
                    userName: "testuser@testemail.ca"
                    orgSlug: "super-admin"
                    role: SUPER_ADMIN
                }
            ) {
                status
            }
        }
        """,
        as_user=user_read,
    )

    if "errors" not in result:
        fail(
            f"Expected to fail, because requesting user does not have super admin rights, instead: {json(result)}"
        )

    [error] = result["errors"]
    assert error["message"] == "Error, unable to update user role."
    assert f"User: {user_read.id} attempted to update {user.id}'s role, but they do not have the permission to {org_one.id}."
