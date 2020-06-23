import pytest
from pytest import fail

from db import DB
from models import Organizations, Users, User_affiliations
from tests.test_functions import json, run


@pytest.fixture()
def save():
    s, cleanup, db_session = DB()
    yield s
    cleanup()


# Super Admin Tests
def test_get_user_as_super_admin(save):
    """
    Test to see if user resolver access control allows super admin to
    request users inside and outside of their organization
    """
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

    result = run(
        query="""
        {
            user(userName: "testuserread@testemail.ca") {
                displayName
            }
        }
        """,
        as_user=super_admin,
    )

    if "errors" in result:
        fail(
            "Tried to select user info as super admin, Instead: {}".format(json(result))
        )

    expected_result = {"data": {"user": [{"displayName": "testuserread"}]}}

    assert result == expected_result


# Admin Same Org
def test_get_user_from_same_org(save):
    """
    Test to see if user resolver access control allows admin to
    request users inside and not outside of their organization
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1"
    )
    save(org_one)
    org_admin = Users(
        display_name="testadmin",
        user_name="testadmin@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="admin", user_organization=org_one,),
        ],
    )
    save(org_admin)
    user_read = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org_one,),
        ],
    )
    save(user_read)

    result = run(
        query="""
        {
            user(userName: "testuserread@testemail.ca") {
                displayName
            }
        }
        """,
        as_user=org_admin,
    )

    if "errors" in result:
        fail("Tried to get user info as org admin, instead: {}".format(json(result)))

    expected_result = {"data": {"user": [{"displayName": "testuserread"}]}}

    assert result == expected_result


# Admin different org
def test_get_user_admin_from_different_org(save):
    """
    Test to see if user resolver access control does not  allow  admin
    from another organization to select them
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1"
    )
    save(org_one)
    org_two = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1"
    )
    save(org_two)
    org_admin = Users(
        display_name="testadmin",
        user_name="testadmin@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="admin", user_organization=org_two,),
        ],
    )
    save(org_admin)
    user_read = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org_one,),
        ],
    )
    save(user_read)

    result = run(
        query="""
        {
            user(userName: "testuserread@testemail.ca") {
                displayName
            }
        }
        """,
        as_user=org_admin,
    )

    if "errors" not in result:
        fail(
            "User query as different org admin should fail, instead: {}".format(
                json(result)
            )
        )

    [error] = result["errors"]
    assert error["message"] == "Error, user cannot be found."


# User write tests
def test_get_user_user_write(save):
    """
    Test to see if user resolver access control to ensure users with user
    write access cannot access this query
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1"
    )
    save(org_one)
    user_write = Users(
        display_name="testuserwrite",
        user_name="testuserwrite@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="user_write", user_organization=org_one,),
        ],
    )
    save(user_write)
    user_read = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org_one,),
        ],
    )
    save(user_read)

    result = run(
        query="""
        {
            user(userName: "testuserread@testemail.ca") {
                displayName
            }
        }
        """,
        as_user=user_write,
    )

    if "errors" not in result:
        fail("User query as user write should fail, instead: {}".format(json(result)))

    [error] = result["errors"]
    assert error["message"] == "Error, user cannot be found."


# User read tests
def test_get_reader_can_access_their_own_info(save):
    """
    Test to see if user resolver access control to ensure users with user
    write access cannot access this query
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1"
    )
    save(org_one)
    user_read = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org_one,),
        ],
    )
    save(user_read)

    results = run(
        query="""
        {
            user(userName: "testuserread@testemail.ca") {
                displayName
            }
        }
        """,
        as_user=user_read,
    )

    if "errors" in results:
        fail("Tried to get users own information, instead: {}".format(json(results)))

    expected_result = {"data": {"user": [{"displayName": "testuserread"}]}}

    assert results == expected_result


def test_get_user_user_read(save):
    """
    Test to see if user resolver access control to ensure users with user
    write access cannot access this query
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1"
    )
    save(org_one)
    user_read_one = Users(
        display_name="testuserreadone",
        user_name="testuserreadone@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org_one,),
        ],
    )
    save(user_read_one)
    user_read_two = Users(
        display_name="testuserreadtwo",
        user_name="testuserreadtwo@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(permission="user_read", user_organization=org_one,),
        ],
    )
    save(user_read_two)

    result = run(
        query="""
        {
            user(userName: "testuserreadtwo@testemail.ca") {
                displayName
            }
        }
        """,
        as_user=user_read_one,
    )

    if "errors" not in result:
        fail("User query as user read should fail, instead: {}".format(json(result)))

    [error] = result["errors"]
    assert error["message"] == "Error, user cannot be found."
