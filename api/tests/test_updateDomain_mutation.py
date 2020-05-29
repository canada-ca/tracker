import pytest
from pytest import fail
from db import DB
from models import (
    Domains,
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


def test_domain_update_super_admin(save):
    """
    Test to see if super admins can update domains
    """
    org_one = Organizations(
        acronym="ORG1", name="Organization 1", slug="organization-1"
    )
    save(org_one)

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
            User_affiliations(permission="admin", user_organization=org_one,),
        ],
    )
    save(super_admin)

    test_domain = Domains(domain="sa.update.domain.ca", organization=org_one,)
    save(test_domain)

    update_result = run(
        mutation="""
        mutation{
            updateDomain(
                currentUrl: "sa.update.domain.ca",
                updatedUrl: "updated.sa.update.domain.ca"
            ) {
                status
            }
        }
        """,
        as_user=super_admin,
    )

    if "errors" in update_result:
        fail("Expected to update a domain, instead: {}".format(json(update_result)))

    update_result_expected = {"data": {"updateDomain": {"status": True}}}

    assert update_result == update_result_expected

    result = run(
        query="""
        {
            domain(urlSlug: "updated-sa-update-domain-ca") {
                url
            }
        }
        """,
        as_user=super_admin,
    )

    result_expected = {"data": {"domain": [{"url": "updated.sa.update.domain.ca"}]}}

    assert result == result_expected


def test_domain_update_org_admin(save):
    """
    Test to see if org admins can update domains
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

    test_domain = Domains(domain="admin.update.domain.ca", organization=org_one,)
    save(test_domain)

    update_result = run(
        mutation="""
        mutation{
            updateDomain(
                currentUrl: "admin.update.domain.ca",
                updatedUrl: "updated.admin.create.domain.ca"
            ) {
                status
            }
        }
        """,
        as_user=org_admin,
    )

    if "errors" in update_result:
        fail("Expected to update a domain, instead: {}".format(json(update_result)))

    update_result_expected = {"data": {"updateDomain": {"status": True}}}

    assert update_result == update_result_expected

    result = run(
        query="""
        {
            domain(urlSlug: "updated-admin-create-domain-ca") {
                url
            }
        }
        """,
        as_user=org_admin,
    )

    result_expected = {"data": {"domain": [{"url": "updated.admin.create.domain.ca"}]}}

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

    test_domain = Domains(domain="admin2.update.domain.ca", organization=org_two,)
    save(test_domain)

    update_result = run(
        mutation="""
        mutation{
            updateDomain(
                currentUrl: "admin2.update.domain.ca",
                updatedUrl: "updated.admin2.update.domain.ca"
            ) {
                status
            }
        }
        """,
        as_user=org_admin,
    )

    if "errors" not in update_result:
        fail("Expected to generate error, instead: {}".format(json(update_result)))

    [error] = update_result["errors"]
    assert (
        error["message"] == "Error, you do not have permission to edit "
        "domains belonging to another organization"
    )


def test_domain_update_user_write(save):
    """
    Test to see if user write can update domains
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

    test_domain = Domains(domain="user.write.domain.ca", organization=org_one,)
    save(test_domain)

    update_result = run(
        mutation="""
        mutation{
            updateDomain(
                currentUrl: "user.write.domain.ca",
                updatedUrl: "updated.user.write.domain.ca"
            ) {
                status
            }
        }
        """,
        as_user=user_write,
    )

    if "errors" in update_result:
        fail("Expected to update a domain, instead: {}".format(json(update_result)))

    update_result_expected = {"data": {"updateDomain": {"status": True}}}

    assert update_result == update_result_expected

    result = run(
        query="""
        {
            domain(urlSlug: "updated-user-write-domain-ca") {
                url
            }
        }
        """,
        as_user=user_write,
    )

    result_expected = {"data": {"domain": [{"url": "updated.user.write.domain.ca"}]}}

    assert result == result_expected


def test_domain_creation_user_write_cant_update_in_different_org(save):
    """
    Test to ensure that user write cant update domains in different org
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

    test_domain = Domains(domain="user.write.domain.ca", organization=org_two,)
    save(test_domain)

    update_result = run(
        mutation="""
        mutation{
            updateDomain(
                currentUrl: "user.write.domain.ca",
                updatedUrl: "updated.user.write.domain.ca"
            ) {
                status
            }
        }
        """,
        as_user=user_write,
    )

    if "errors" not in update_result:
        fail("Expected to generate error, instead: {}".format(json(update_result)))

    [error] = update_result["errors"]
    assert (
        error["message"] == "Error, you do not have permission to edit "
        "domains belonging to another organization"
    )


def test_domain_creation_user_read_cant_update_domain(save):
    """
    Test to ensure that user read cant create domains
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

    test_domain = Domains(domain="user.read.domain.ca", organization=org_one)
    save(test_domain)

    update_result = run(
        mutation="""
        mutation{
            updateDomain(
                currentUrl: "user.read.domain.ca",
                updatedUrl: "updated.user.read.domain.ca"
            ) {
                status
            }
        }
        """,
        as_user=user_read,
    )

    if "errors" not in update_result:
        fail("Expected to generate error, instead: {}".format(json(update_result)))

    [error] = update_result["errors"]
    assert (
        error["message"] == "Error, you do not have permission to edit "
        "domains belonging to another organization"
    )
