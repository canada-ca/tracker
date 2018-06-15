from data import models


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
        assert not [d for d in connection.domains.all()]
