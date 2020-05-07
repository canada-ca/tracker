from werkzeug.test import create_environ
from flask import Request
import pytest
from graphene.test import Client
from app import app
from db import DB
from queries import schema
from models import Users
from backend.security_check import SecurityAnalysisBackend


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

    backend = SecurityAnalysisBackend()
    client = Client(schema)
    get_token = client.execute(
        """
        mutation{
            signIn(userName:"testsuperadmin@testemail.ca", password:"testpassword123"){
                authToken
            }
        }
        """,
        backend=backend,
    )

    assert get_token["data"]["signIn"]["authToken"] is not None
    token = get_token["data"]["signIn"]["authToken"]
    assert token is not None

    environ = create_environ()
    environ.update(HTTP_AUTHORIZATION=token)
    request_headers = Request(environ)

    results = client.execute(
        """
        {
            user {
                displayName
            }
        }
        """,
        context_value=request_headers,
        backend=backend,
    )
    user = results["data"].values()
    [[details]] = user
    assert details == {"displayName": "testsuperadmin"}


def test_invalid_depth_query(save):
    test_super_admin = Users(
        display_name="testsuperadmin",
        user_name="testsuperadmin@testemail.ca",
        password="testpassword123",
    )
    save(test_super_admin)

    backend = SecurityAnalysisBackend(10)
    client = Client(schema)
    executed = client.execute(
        """
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
        backend=backend,
    )
    assert executed["errors"]
    assert executed["errors"][0]
    assert executed["errors"][0]["message"] == "Query is too complex"
