from pathlib import Path
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

    preprocess.pull_data(tmpdir, connection)

    assert (Path(tmpdir) / 'owners.csv').is_file() # pylint: disable=no-member
    assert (Path(tmpdir) / 'domains.csv').is_file() # pylint: disable=no-member
