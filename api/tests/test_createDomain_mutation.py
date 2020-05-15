import pytest

from pytest import fail

from app import app
from db import DB
from models import (
    Organizations,
    Users,
    User_affiliations,
)
from tests.test_functions import json, run


@pytest.fixture
def save():
    with app.app_context():
        s, cleanup, session = DB()
        yield s
        cleanup()


def test_domain_creation_super_admin(save):
    """
    Test to see if super admins can create domains
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
            User_affiliations(
                permission="admin",
                user_organization=Organizations(
                    acronym="ORG1", name="Organization 1", slug="organization-1"
                ),
            ),
        ],
    )
    save(super_admin)

    create_result = run(
        mutation="""
        mutation{
            createDomain(orgSlug: "organization-1", url: "sa.create.domain.ca") {
                status
            }
        }
        """,
        as_user=super_admin,
    )

    if "errors" in create_result:
        fail("Expected to create a domain, instead: {}".format(json(create_result)))

    create_result_expected = {"data": {"createDomain": {"status": True}}}

    assert create_result == create_result_expected

    result = run(
        query="""
        {
            domain(urlSlug: "sa-create-domain-ca") {
                url
            }
        }
        """,
        as_user=super_admin,
    )

    result_expected = {"data": {"domain": [{"url": "sa.create.domain.ca"}]}}

    assert result == result_expected


def test_domain_creation_super_admin_cant_create_in_sa_org(save):
    """
    Test to ensure that super admins cant create domains in sa org
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

    create_result = run(
        mutation="""
        mutation{
            createDomain(orgSlug: "super-admin", url: "sa.create.domain.ca") {
                status
            }
        }
        """,
        as_user=super_admin,
    )

    if "errors" not in create_result:
        fail("Expected to generate error, instead: {}".format(json(create_result)))

    [error] = create_result["errors"]
    assert error["message"] == "Error, you cannot add a domain to this organization."


def test_domain_creation_org_admin(save):
    """
    Test to see if org admins can create domains
    """
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

    create_result = run(
        mutation="""
        mutation{
            createDomain(orgSlug: "organization-1", url: "admin.create.domain.ca") {
                status
            }
        }
        """,
        as_user=org_admin,
    )

    if "errors" in create_result:
        fail("Expected to create a domain, instead: {}".format(json(create_result)))

    create_result_expected = {"data": {"createDomain": {"status": True}}}

    assert create_result == create_result_expected

    result = run(
        query="""
        {
            domain(urlSlug: "admin-create-domain-ca") {
                url
            }
        }
        """,
        as_user=org_admin,
    )

    result_expected = {"data": {"domain": [{"url": "admin.create.domain.ca"}]}}

    assert result == result_expected


def test_domain_creation_org_admin_cant_create_in_different_org(save):
    """
    Test to ensure that org admins cant create domains in different org
    """
    org_two = Organizations(
        acronym="ORG2", name="Organization 2", slug="organization-2"
    )
    save(org_two)

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

    create_result = run(
        mutation="""
        mutation{
            createDomain(orgSlug: "organization-2", url: "admin.create.domain.ca") {
                status
            }
        }
        """,
        as_user=org_admin,
    )

    if "errors" not in create_result:
        fail("Expected to generate error, instead: {}".format(json(create_result)))

    [error] = create_result["errors"]
    assert (
        error["message"] == "Error, you do not have permission to create a "
        "domain for that organization"
    )


def test_domain_creation_user_write(save):
    """
    Test to see if user write can create domains
    """
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

    create_result = run(
        mutation="""
        mutation{
            createDomain(orgSlug: "organization-1", url: "user.write.create.domain.ca") {
                status
            }
        }
        """,
        as_user=user_write,
    )

    if "errors" in create_result:
        fail("Expected to create a domain, instead: {}".format(json(create_result)))

    create_result_expected = {"data": {"createDomain": {"status": True}}}

    assert create_result == create_result_expected

    result = run(
        query="""
        {
            domain(urlSlug: "user-write-create-domain-ca") {
                url
            }
        }
        """,
        as_user=user_write,
    )

    result_expected = {"data": {"domain": [{"url": "user.write.create.domain.ca"}]}}

    assert result == result_expected


def test_domain_creation_user_write_cant_create_in_different_org(save):
    """
    Test to ensure that user write cant create domains in different org
    """
    org_two = Organizations(
        acronym="ORG2", name="Organization 2", slug="organization-2"
    )
    save(org_two)

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

    create_result = run(
        mutation="""
        mutation{
            createDomain(orgSlug: "organization-2", url: "user.write.create.domain.ca") {
                status
            }
        }
        """,
        as_user=user_write,
    )

    if "errors" not in create_result:
        fail("Expected to generate error, instead: {}".format(json(create_result)))

    [error] = create_result["errors"]
    assert (
        error["message"] == "Error, you do not have permission to create a "
        "domain for that organization"
    )


def test_domain_creation_user_read_cant_create_domain(save):
    """
    Test to ensure that user read cant create domains
    """

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

    create_result = run(
        mutation="""
        mutation{
            createDomain(orgSlug: "organization-1", url: "user.read.create.domain.ca") {
                status
            }
        }
        """,
        as_user=user_read,
    )

    if "errors" not in create_result:
        fail("Expected to generate error, instead: {}".format(json(create_result)))

    [error] = create_result["errors"]
    assert (
        error["message"] == "Error, you do not have permission to create a "
        "domain for that organization"
    )
