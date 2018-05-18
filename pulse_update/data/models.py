import typing
import pymongo


# Data loads should clear the entire database first.
def _clear_collection(client: pymongo.MongoClient, name: str, database: typing.Optional[str] = None):
    client.get_database(database).drop_collection(name)


def _insert_all(
        client: pymongo.MongoClient,
        collection: str,
        documents: typing.Iterable[typing.Dict],
        database: typing.Optional[str] = None) -> None:
    client.get_database(database).get_collection(collection).insert_many(documents)


def _insert(
        client: pymongo.MongoClient,
        collection: str,
        document: typing.Dict,
        database: typing.Optional[str] = None) -> None:
    client.get_database(database).get_collection(collection).insert_one(document)


def _find(
        client: pymongo.MongoClient,
        collection: str,
        query: typing.Dict,
        database: typing.Optional[str] = None) -> typing.Iterable[typing.Dict]:
    return client.get_database(database).get_collection(collection).find(query, {'_id': False})


class _Collection():

    def __init__(self, client: pymongo.MongoClient, name: str) -> None:
        self._name = name
        self._client = client
        try:
            self._db = client.get_database().name
        except pymongo.errors.ConfigurationError:
            self._db = 'pulse'

    def create_all(self, documents: typing.Iterable[typing.Dict]) -> None:
        _insert_all(self._client, self._name, documents, self._db)

    def create(self, document: typing.Dict) -> None:
        _insert(self._client, self._name, document, self._db)

    def all(self) -> typing.Iterable[typing.Dict]:
        return _find(self._client, self._name, {}, self._db)

    def clear(self) -> None:
        _clear_collection(self._client, self._name, self._db)


class Connection():

    def __init__(self, connection_string: str) -> None:
        self._client = pymongo.MongoClient(connection_string)

    def __enter__(self) -> 'Connection':
        return self

    def __exit__(self, exc_type, exc_value, traceback) -> None:
        self._client.close()

    @property
    def domains(self) -> _Collection:
        return _Collection(self._client, 'domains')

    @property
    def reports(self) -> _Collection:
        return _Collection(self._client, 'reports')

    @property
    def agencies(self) -> _Collection:
        return _Collection(self._client, 'agencies')

    @property
    def parents(self) -> _Collection:
        return _Collection(self._client, 'parents')

    @property
    def subdomains(self) -> _Collection:
        return _Collection(self._client, 'subdomains')

    def close(self) -> None:
        self._client.close()
