import sys
import os
from os.path import dirname, join, expanduser, normpath, realpath

import pyotp
import pytest
from flask_bcrypt import Bcrypt
from graphene.test import Client

from unittest import TestCase

# This is the only way I could get imports to work for unit testing.
PACKAGE_PARENT = '..'
SCRIPT_DIR = dirname(realpath(join(os.getcwd(), expanduser(__file__))))
sys.path.append(normpath(join(SCRIPT_DIR, PACKAGE_PARENT)))

from manage import seed, remove_seed
seed()
from db import *
from app import app
from queries import schema
from models import Sectors, Groups
from functions.error_messages import *
from backend import DepthAnalysisBackend
remove_seed()


@pytest.fixture(scope='class')
def user_schema_test_db_init():
    db.init_app(app)
    bcrypt = Bcrypt(app)

    with app.app_context():
        test_sector = Sectors(
            id=1,
            zone='ZO1',
            sector='SO1'
        )
        db.session.add(test_sector)
        test_group = Groups(
            id=1,
            s_group='GO1',
            sector_id=1
        )
        db.session.add(test_group)
        db.session.commit()

    yield

    with app.app_context():
        Groups.query.delete()
        Sectors.query.delete()
        db.session.commit()


##
# This class of tests works within the 'createUser' api endpoint
@pytest.mark.usefixtures('user_schema_test_db_init')
class TestDepthCheck(TestCase):
    def test_valid_depth_query(self):
        backend = DepthAnalysisBackend()
        client = Client(schema)
        query = client.execute(
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
                }
            }
            ''', backend=backend)
        result_refr = {
            "data": {
                "getSectorById": [
                    {
                        "groups": {
                            "edges": [
                                {
                                    "node": {
                                        "sectorId": 1
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
        self.assertDictEqual(result_refr, query)

    def test_invalid_depth_query(self):
        backend = DepthAnalysisBackend()
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
        result_refr = {
            "data": {
                "getSectorById": [
                    {
                        "groups": {
                            "edges": [
                                {
                                    "node": {
                                        "groupSector": {
                                            "groups": {
                                                "edges": [
                                                    {
                                                        "node": {
                                                            "groupSector": {
                                                                "groups": {
                                                                    "edges": [
                                                                        {
                                                                            "node": {
                                                                                "groupSector": {
                                                                                    "groups": {
                                                                                        "edges": [
                                                                                            {
                                                                                                "node": {
                                                                                                    "groupSector": {
                                                                                                        "groups": {
                                                                                                            "edges": [
                                                                                                                {
                                                                                                                    "node": {
                                                                                                                        "groupSector": {
                                                                                                                            "id": "U2VjdG9yczox"
                                                                                                                        }
                                                                                                                    }
                                                                                                                }
                                                                                                            ]
                                                                                                        }
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        ]
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                    ]
                                                                }
                                                            }
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
        # self.assertDictEqual(result_refr, executed)
        assert executed['errors']
        assert executed['errors'][0]
        assert executed['errors'][0]['message'] == 'Query is too complex'
