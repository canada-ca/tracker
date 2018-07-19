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

    def test_upsert_all(self, connection: models.Connection) -> None: # pylint: disable=no-self-use
        connection.domains.create_all({'test': i, 'other': -i} for i in range(5))

        connection.domains.upsert_all(
            [{'test': i, 'other': i} for i in range(4)] +[{'test': 7, 'other': -7}],
            key_column='test'
        )
        results = [d for d in connection.domains.all()]

        assert len(results) == 6
        assert sorted(results, key=lambda d: d['test']) ==  \
                [{'test': i, 'other': i} for i in range(4)] + \
                [{'test': 4, 'other': -4}, {'test': 7, 'other': -7}]


    def test_replace(self, connection: models.Connection) -> None: # pylint: disable=no-self-use
        connection.domains.create({'test': 'value'})
        connection.domains.replace({'test': 'value'}, {'test': 'other_value'})
        results = [d for d in connection.domains.all()]

        assert len(results) == 1
        assert results[0] == {'test': 'other_value'}
