import pytest

from models import Organizations
from models import Domains
from db import DB


@pytest.fixture
def save():
    s, cleanup, _ = DB()
    yield s
    cleanup()


def test_orgs_make_a_slug_from_the_name():
    org = Organizations(name="Treasury Board Secretariat")
    assert org.slug == "treasury-board-secretariat"


def test_count_of_related_domains_is_available_via_domain_count(save):
    org = Organizations(
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
    save(org)

    assert org.domain_count == 1
