import sys
import os
from os.path import dirname, join, expanduser, normpath, realpath

import pytest
from graphene.test import Client

from unittest import TestCase

# This is the only way I could get imports to work for unit testing.
PACKAGE_PARENT = '..'
SCRIPT_DIR = dirname(realpath(join(os.getcwd(), expanduser(__file__))))
sys.path.append(normpath(join(SCRIPT_DIR, PACKAGE_PARENT)))

from manage import seed, remove_seed
seed()
from db import db
from app import app
from queries import schema
from models import Users
from backend.security_check import SecurityAnalysisBackend
remove_seed()


@pytest.fixture(scope='class')
def user_schema_test_db_init():
    db.init_app(app)

    with app.app_context():
        test_user = Users(
            id=1,
            display_name="test"
        )
        db.session.add(test_user)
        db.session.commit()

    yield

    with app.app_context():
        Users.query.delete()
        db.session.commit()


##
# This class of tests works within the 'createUser' api endpoint
@pytest.mark.usefixtures('user_schema_test_db_init')
class TestCostCheck(TestCase):
    def test_valid_cost_query(self):
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            query = client.execute(
                '''
                {
                    users {
                        edges {
                            node {
                                displayName
                            }
                        }
                    }
                }
                ''', backend=backend)
            result_refr = {
                "data": {
                    "users": {
                        "edges": [
                            {
                                "node": {
                                    "displayName": "test"
                                }
                            }
                        ]
                    }
                }
            }
            self.assertDictEqual(result_refr, query)

    def test_invalid_cost_query(self):
        backend = SecurityAnalysisBackend(10, 5)
        client = Client(schema)
        executed = client.execute(
            '''
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
            ''', backend=backend)
        assert executed['errors']
        assert executed['errors'][0]
        assert executed['errors'][0]['message'] == 'Query cost is too high'
