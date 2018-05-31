import random
import typing
import pymongo
import pytest
import _pytest
from data import models


def connection_string() -> str:
    database = f'tracker_{random.randint(0, 1000)}'
    connection = f'mongodb://localhost:27017/{database}'

    return connection


@pytest.fixture(params=['mongodb://localhost:27017', connection_string()])
def connection(request: _pytest.fixtures.SubRequest) -> typing.Iterator[models.Connection]:
    connection_string = request.param
    with models.Connection(connection_string) as connection:
        yield connection

    with pymongo.MongoClient(connection_string) as client:
        try:
            client.drop_database(client.get_database())
        except pymongo.errors.ConfigurationError:
            client.drop_database('tracker')

class TestDomains:

    def test_create(self, connection: models.Connection) -> None: #pylint: disable=no-self-use
        connection.domains.create({'test': 'value'})
        assert {'test': 'value'} in [d for d in connection.domains.all()]

    def test_create_all(self, connection: models.Connection) -> None: #pylint: disable=no-self-use
        connection.domains.create_all({'test': i} for i in range(5))
        assert len([d for d in connection.domains.all()]) == 5

    def test_clear_collection(self, connection: models.Connection) -> None: #pylint: disable=no-self-use
        connection.domains.create_all({'test': i} for i in range(5))
        assert len([d for d in connection.domains.all()]) == 5
        connection.domains.clear()
        assert len([d for d in connection.domains.all()]) == 0
