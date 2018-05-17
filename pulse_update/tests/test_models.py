import random
import typing
import pymongo
import pytest
from data import models


@pytest.fixture
def connection_string() -> typing.Iterator[str]:
    database = f'pulse_{random.randint(0, 1000)}'
    connection = f'mongodb://localhost:27017/{database}'

    yield connection

    with pymongo.MongoClient('mongodb://localhost:27017') as client:
        client.drop_database(database)


@pytest.fixture
def connection(connection_string: str) -> typing.Iterator[models.Connection]:
    with models.Connection(connection_string) as connection:
        yield connection


class TestDomains:

    def test_create(self, connection: models.Connection) -> None: #pylint: disable=no-self-use
        connection.domains.create({'test': 'value'})
        assert {'test': 'value'} in [d for d in connection.domains.all()]

    def test_create_all(self, connection: models.Connection) -> None: #pylint: disable=no-self-use
        connection.domains.create_all({'test': i} for i in range(5))
        assert len([d for d in connection.domains.all()]) == 5
