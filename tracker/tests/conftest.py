import os
import random
import socket
import typing
import pymongo
import pytest
import _pytest
from data import models


def local_mongo_is_running() -> bool:
    if 'CIRCLECI' in os.environ:
        return True

    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        sock.bind(("127.0.0.1", 27017))
    except socket.error:
        return True
    else:
        sock.close()
        return False


def connection_string() -> str:
    database = f'track_{random.randint(0, 1000)}'
    connection = f'mongodb://localhost:27017/{database}'

    return connection


@pytest.fixture(params=['mongodb://localhost:27017', connection_string()])
def connection(request: _pytest.fixtures.SubRequest) -> typing.Iterator[models.Connection]:
    if not local_mongo_is_running():
        pytest.skip('Local MongoDB instance is not running.')

    connection_string = request.param
    with models.Connection(connection_string) as connection:
        yield connection

    with pymongo.MongoClient(connection_string) as client:
        try:
            client.drop_database(client.get_database())
        except pymongo.errors.ConfigurationError:
            client.drop_database('track')
