import pytest

from app import app
from db import DB
from models import Users
from backend.security_check import SecurityAnalysisBackend
from tests.test_functions import json, run


@pytest.fixture
def save():
    with app.app_context():
        save, cleanup, _ = DB()
        yield save
        cleanup()


def test_valid_depth_query(save):
    test_super_admin = Users(
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
    )
    user = result["data"].values()
    [[details]] = user
    assert details == {"displayName": "testsuperadmin"}


def test_invalid_depth_query(save):
    test_super_admin = Users(
        display_name="testsuperadmin",
        user_name="testsuperadmin@testemail.ca",
        password="testpassword123",
    )
    save(test_super_admin)

    result = run(
        query="""
        {
          getSectorById(id: 1) {
            groups{
              edges{
                node{
                  groupSector{
                    groups{
                      edges{
                        node{
                          groupSector{
                            groups{
                              edges{
                                node{
                                  groupSector{
                                    groups{
                                      edges{
                                        node{
                                          groupSector{
                                            groups{
                                              edges{
                                                node{
                                                  groupSector
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        """,
        as_user=test_super_admin,
        backend=SecurityAnalysisBackend(10),
    )

    assert result["errors"]
    assert result["errors"][0]
    assert result["errors"][0]["message"] == "Query is too complex"
