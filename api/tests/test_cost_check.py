import pytest

from db import DB
from app import app
from queries import schema
from models import Users
from tests.test_functions import json, run
from backend.security_check import SecurityAnalysisBackend


@pytest.fixture()
def save():
    with app.app_context():
        s, cleanup, db_session = DB()
        yield s
        cleanup()


def test_valid_cost_query(save):
    """
    Test cost check function operates normally with valid query
    """
    test_super_admin = Users(
        id=2,
        display_name="testsuperadmin",
        user_name="testsuperadmin@testemail.ca",
        password="testpassword123",
    )
    save(test_super_admin)

    result = run(
        query="""
            {
                user {
                    displayName
                }
            }
        """,
        as_user=test_super_admin,
        schema=schema
    )

    expected = {"data": {"user": [{"displayName": "testsuperadmin"}]}}
    assert result == expected


def test_invalid_cost_query(save):
    """
    Test cost check function detects that cost is too high
    """
    test_super_admin = Users(
        id=2,
        display_name="testsuperadmin",
        user_name="testsuperadmin@testemail.ca",
        password="testpassword123",
    )
    save(test_super_admin)

    result = run(
        query="""
            {
                getSectorById(id: 1) {
                    groups {
                        edges {
                            node {
                                sectorId
                            }
                        }
                    }
                    groups {
                        edges {
                            node {
                                sectorId
                            }
                        }
                    }
                    groups {
                        edges {
                            node {
                                sectorId
                            }
                        }
                    }
                    groups {
                        edges {
                            node {
                                sectorId
                            }
                        }
                    }
                    groups {
                        edges {
                            node {
                                sectorId
                            }
                        }
                    }
                }
            }
        """,
        as_user=test_super_admin,
        schema=schema,
        backend=SecurityAnalysisBackend(10, 5)
    )

    assert result["errors"]
    assert result["errors"][0]
    assert result["errors"][0]["message"] == "Query cost is too high"
