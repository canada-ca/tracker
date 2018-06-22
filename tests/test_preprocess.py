import csv
from io import StringIO
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


def test_insert_data(connection: models.Connection) -> None:
    with StringIO() as owners_io:
        owner_writer = csv.DictWriter(owners_io, fieldnames=['domain', 'organization_name_en', 'organization_name_fr'])
        owner_writer.writeheader()

        owners = [
            {
                'domain': 'digital.canada.ca',
                'organization_name_en': 'Treasury Board of Canada Secretariat',
                'organization_name_fr': 'Secrétariat du Conseil du Trésor',
            },
            {
                'domain': 'numerique.canada.ca',
                'organization_name_en': 'Treasury Board of Canada Secretariat',
                'organization_name_fr': 'Secrétariat du Conseil du Trésor',
            },
            {
                'domain': 'canada.ca',
                'organization_name_en': 'Shared Services Canada',
                'organization_name_fr': 'Services partagés Canada',
            }
        ]

        for owner in owners:
            owner_writer.writerow(owner)
        owners_io.seek(0)

        preprocess.insert_data(owners_io, None, None, False, connection)
        assert sorted(
            [d for d in connection.owners.all()], key=lambda d: d.get('domain')
        ) == sorted(owners, key=lambda d: d.get('domain'))

        owners_io.seek(0)
        owners_io.truncate()
        owner_writer.writeheader()
        owners[0]['organization_name_en'] = 'Test'
        for owner in owners:
            owner_writer.writerow(owner)
        owners_io.seek(0)

        preprocess.insert_data(owners_io, None, None, True, connection)
        docs = [d for d in connection.owners.all()]
        assert len(docs) == 3
        assert docs[0]['organization_name_en'] == 'Test'
