import pytest
from pytest import fail

from db import DB
from models import Organizations, Domains, Users, User_affiliations
from tests.test_functions import json, run


@pytest.fixture()
def save():
    save, cleanup, session = DB()
    yield save
    cleanup()


def test_findOrganizationDetailsBySlug_returns_a_type_with_a_domainCount(save):
    org1 = Organizations(
        acronym="ORG1",
        domains=[Domains(domain="somecooldomain.ca")],
        name="Organization 1",
        org_tags={
            "zone": "Prov",
            "sector": "Banking",
            "province": "Alberta",
            "city": "Calgary",
        },
    )
    save(org1)

    admin = Users(
        display_name="Admin",
        user_name="admin@example.com",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org1, permission="admin")
        ],
    )
    save(admin)

    result = run(
        """
		{
		  organization:findOrganizationDetailBySlug(slug: "organization-1") {
            domainCount
          }
		}
        """,
        as_user=admin,
    )

    expected_result = {
        "data": {
            "organization": {
              "domainCount": 1
            }
        }
    }

    if "errors" in result:
        fail(
            "Expect domainCount to be 1 when one domain exists: {}".format(
                result["errors"]
            )
        )

    assert result == expected_result


