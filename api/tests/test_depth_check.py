import sys
import os
from os.path import dirname, join, expanduser, normpath, realpath

from werkzeug.test import create_environ
from flask import Request

import pytest
from graphene.test import Client
from flask_bcrypt import Bcrypt

from unittest import TestCase

# This is the only way I could get imports to work for unit testing.
PACKAGE_PARENT = '..'
SCRIPT_DIR = dirname(realpath(join(os.getcwd(), expanduser(__file__))))
sys.path.append(normpath(join(SCRIPT_DIR, PACKAGE_PARENT)))

from manage import seed, remove_seed
seed()
from app import app
from db import db
from queries import schema
from models import Users
from backend.security_check import SecurityAnalysisBackend
remove_seed()


@pytest.fixture(scope='class')
def user_schema_test_db_init():
    db.init_app(app)
    bcrypt = Bcrypt(app)

    with app.app_context():
        test_super_admin = Users(
            id=2,
            display_name="testsuperadmin",
            user_name="testsuperadmin@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123").decode("UTF-8")
        )
        db.session.add(test_super_admin)
        db.session.commit()

    yield

    with app.app_context():
        Users.query.delete()
        db.session.commit()


##
# This class of tests works within the 'createUser' api endpoint
@pytest.mark.usefixtures('user_schema_test_db_init')
class TestDepthCheck(TestCase):
    def test_valid_depth_query(self):
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                '''
                mutation{
                    signIn(userName:"testsuperadmin@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                ''', backend=backend)
            assert get_token['data']['signIn']['authToken'] is not None
            token = get_token['data']['signIn']['authToken']
            assert token is not None

            environ = create_environ()
            environ.update(
                HTTP_AUTHORIZATION=token
            )
            request_headers = Request(environ)

            query = client.execute(
                '''
                {
                    user {
                        displayName
                    }
                }
                ''', context_value=request_headers, backend=backend)
            result_refr = {
                "data": {
                    "user": [
                        {
                            "displayName": "testsuperadmin"
                        }
                    ]
                }
            }
            self.assertDictEqual(result_refr, query)

    def test_invalid_depth_query(self):
        backend = SecurityAnalysisBackend(10)
        client = Client(schema)
        executed = client.execute(
            '''
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
            ''', backend=backend)
        assert executed['errors']
        assert executed['errors'][0]
        assert executed['errors'][0]['message'] == 'Query is too complex'
