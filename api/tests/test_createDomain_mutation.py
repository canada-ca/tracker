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


def test_domain_creation_super_admin(save, caplog):
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

    caplog.set_level(logging.INFO)
    create_result = run(
        mutation="""
        mutation{
            createDomain(
                input: {
                    orgSlug: "organization-1",
                    url: "sa.create.domain.ca"
                }
            ) {
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
    assert (
        f"User: {super_admin.id} successfully created sa.create.domain.ca for the organization-1 organization."
        in caplog.text
    )

    result = run(
        query="""
        {
            findDomainBySlug(
                input: {
                    urlSlug: "sa-create-domain-ca"
                }
            ) {
                url
            }
        }
        """,
        as_user=super_admin,
    )

    result_expected = {"data": {"findDomainBySlug": {"url": "sa.create.domain.ca"}}}

    assert result == result_expected


def test_domain_creation_super_admin_cant_create_in_sa_org(save, caplog):
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

    caplog.set_level(logging.WARNING)
    create_result = run(
        mutation="""
        mutation{
            createDomain(
                input: {
                    orgSlug: "super-admin",
                    url: "sa.create.domain.ca"
                }
            ) {
                status
            }
        }
        """,
        as_user=super_admin,
    )

    if "errors" not in create_result:
        fail("Expected to generate error, instead: {}".format(json(create_result)))

    [error] = create_result["errors"]
    assert error["message"] == "Error, unable to create domain."
    assert (
        f"User: {super_admin.id} tried to create a domain in the super admin org."
        in caplog.text
    )


def test_domain_creation_super_admin_cant_create_in_an_org_that_doesnt_exist(
    save, caplog
):
    """
    Test to ensure that super admin cant create domains in an org that doesn't exist
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

    caplog.set_level(logging.INFO)
    create_result = run(
        mutation="""
        mutation{
            createDomain(
                input: {
                    orgSlug: "organization-3",
                    url: "user.write.create.domain.ca"
                }
            ) {
                status
            }
        }
        """,
        as_user=super_admin,
    )

    if "errors" not in create_result:
        fail("Expected to generate error, instead: {}".format(json(create_result)))

    [error] = create_result["errors"]
    assert error["message"] == "Error, unable to create domain."
    assert (
        f"User: {super_admin.id} tried to create a domain in organization-3, but organization does not exist."
        in caplog.text
    )


def test_domain_creation_org_admin(save, caplog):
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

    caplog.set_level(logging.INFO)
    create_result = run(
        mutation="""
        mutation{
            createDomain(
                input: {
                    orgSlug: "organization-1",
                    url: "admin.create.domain.ca"
                }
            ) {
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
    assert (
        f"User: {org_admin.id} successfully created admin.create.domain.ca for the organization-1 organization."
        in caplog.text
    )

    result = run(
        query="""
        {
            findDomainBySlug(
                input: {
                    urlSlug: "admin-create-domain-ca"
                }
            ) {
                url
            }
        }
        """,
        as_user=org_admin,
    )

    result_expected = {"data": {"findDomainBySlug": {"url": "admin.create.domain.ca"}}}

    assert result == result_expected


def test_domain_creation_org_admin_cant_create_in_different_org(save, caplog):
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

    caplog.set_level(logging.WARNING)
    create_result = run(
        mutation="""
        mutation{
            createDomain(
                input: {
                    orgSlug: "organization-2",
                    url: "admin.create.domain.ca"
                }
            ) {
                status
            }
        }
        """,
        as_user=org_admin,
    )

    if "errors" not in create_result:
        fail("Expected to generate error, instead: {}".format(json(create_result)))

    [error] = create_result["errors"]
    assert error["message"] == "Error, unable to create domain."
    assert f"User: {org_admin.id} tried to create a domain for this org: organization-2, but does not have the proper permissions."


def test_domain_creation_org_admin_cant_create_in_an_org_that_doesnt_exist(
    save, caplog
):
    """
    Test to ensure that org admin cant create domains in an org that doesn't exist
    """

    admin = Users(
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
    save(admin)

    caplog.set_level(logging.INFO)
    create_result = run(
        mutation="""
        mutation{
            createDomain(
                input: {
                    orgSlug: "organization-3",
                     url: "user.write.create.domain.ca"
                }
            ) {
                status
            }
        }
        """,
        as_user=admin,
    )

    if "errors" not in create_result:
        fail("Expected to generate error, instead: {}".format(json(create_result)))

    [error] = create_result["errors"]
    assert error["message"] == "Error, unable to create domain."
    assert (
        f"User: {admin.id} tried to create a domain in organization-3, but organization does not exist."
        in caplog.text
    )


def test_domain_creation_user_write(save, caplog):
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

    caplog.set_level(logging.INFO)
    create_result = run(
        mutation="""
        mutation{
            createDomain(
                input: {
                    orgSlug: "organization-1",
                    url: "user.write.create.domain.ca"
                }
            ) {
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
    assert (
        f"User: {user_write.id} successfully created user.write.create.domain.ca for the organization-1 organization."
        in caplog.text
    )

    result = run(
        query="""
        {
            findDomainBySlug(
                input: {
                    urlSlug: "user-write-create-domain-ca"
                }
            ) {
                url
            }
        }
        """,
        as_user=user_write,
    )

    result_expected = {
        "data": {"findDomainBySlug": {"url": "user.write.create.domain.ca"}}
    }

    assert result == result_expected


def test_domain_creation_user_write_cant_create_in_different_org(save, caplog):
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

    caplog.set_level(logging.INFO)
    create_result = run(
        mutation="""
        mutation{
            createDomain(
                input: {
                    orgSlug: "organization-2",
                    url: "user.write.create.domain.ca"
                }
            ) {
                status
            }
        }
        """,
        as_user=user_write,
    )

    if "errors" not in create_result:
        fail("Expected to generate error, instead: {}".format(json(create_result)))

    [error] = create_result["errors"]
    assert error["message"] == "Error, unable to create domain."
    assert (
        f"User: {user_write.id} tried to create a domain for this org: organization-2, but does not have the proper permissions."
        in caplog.text
    )


def test_domain_creation_user_write_cant_create_in_an_org_that_doesnt_exist(
    save, caplog
):
    """
    Test to ensure that user write cant create domains in an org that doesn't exist
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

    caplog.set_level(logging.INFO)
    create_result = run(
        mutation="""
        mutation{
            createDomain(
                input: {
                    orgSlug: "organization-3",
                    url: "user.write.create.domain.ca"
                }
            ) {
                status
            }
        }
        """,
        as_user=user_write,
    )

    if "errors" not in create_result:
        fail("Expected to generate error, instead: {}".format(json(create_result)))

    [error] = create_result["errors"]
    assert error["message"] == "Error, unable to create domain."
    assert (
        f"User: {user_write.id} tried to create a domain in organization-3, but organization does not exist."
        in caplog.text
    )


def test_domain_creation_user_read_cant_create_domain(save, caplog):
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

    caplog.set_level(logging.WARNING)
    create_result = run(
        mutation="""
        mutation{
            createDomain(
                input: {
                    orgSlug: "organization-1",
                    url: "user.read.create.domain.ca"
                }
            ) {
                status
            }
        }
        """,
        as_user=user_read,
    )

    if "errors" not in create_result:
        fail("Expected to generate error, instead: {}".format(json(create_result)))

    [error] = create_result["errors"]
    assert error["message"] == "Error, unable to create domain."
    assert (
        f"User: {user_read.id} tried to create a domain for this org: organization-1, but does not have the proper permissions."
        in caplog.text
    )
