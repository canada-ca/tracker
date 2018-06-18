from data import models
from data import preprocess

def test_pull_data(tmpdir, connection: models.Connection) -> None:
    connection.owners.create(
        {
            'domain': 'canada.ca',
            'organization_en': 'Government of Canada',
            'organization_fr': 'Gouvernement du Canada',
        }
    )
    connection.domains.create_all([{'domain': 'digital.canada.ca'}, {'domain': 'numerique.canada.ca'}])

    preprocess.pull_data(str(tmpdir), connection)

    assert (tmpdir / 'owners.csv').isfile() # pylint: disable=no-member
    assert (tmpdir / 'domains.csv').isfile() # pylint: disable=no-member
