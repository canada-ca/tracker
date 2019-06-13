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


def test_update_data(connection: models.Connection) -> None:

    def write_to_sio(sio, writer, data, truncate=False):
        if truncate:
            sio.seek(0)
            sio.truncate()
        writer.writeheader()
        for record in data:
            writer.writerow(record)
        sio.seek(0)

    with StringIO() as owners_io, StringIO() as domains_io, StringIO() as ciphers_io:
        owner_writer = csv.DictWriter(owners_io, fieldnames=['domain', 'organization_en', 'organization_fr'])
        domain_writer = csv.DictWriter(domains_io, fieldnames=['domain'])
        cipher_writer = csv.DictWriter(ciphers_io, fieldnames=['cipher'])

        owners = [
            {
                'domain': 'digital.canada.ca',
                'organization_en': 'Treasury Board of Canada Secretariat',
                'organization_fr': 'Secrétariat du Conseil du Trésor',
            },
            {
                'domain': 'numerique.canada.ca',
                'organization_en': 'Treasury Board of Canada Secretariat',
                'organization_fr': 'Secrétariat du Conseil du Trésor',
            },
            {
                'domain': 'canada.ca',
                'organization_en': 'Shared Services Canada',
                'organization_fr': 'Services partagés Canada',
            }
        ]

        domains = [
            {'domain': 'digital.canada.ca'},
            {'domain': 'numerique.canada.ca'},
            {'domain': 'canada.ca'}
        ]

        ciphers = [
            {'cipher': 'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384'},
            {'cipher': 'TLS_ECDHE_ECDSA_WITH_AES_128_CCM'},
            {'cipher': 'TLS_ECDHE_ECDSA_WITH_AES_256_CCM'}
        ]

        write_to_sio(owners_io, owner_writer, owners, False)
        write_to_sio(domains_io, domain_writer, domains, False)
        write_to_sio(ciphers_io, cipher_writer, ciphers, False)

        preprocess.update_data(owners_io, domains_io, ciphers_io, connection)

        assert sorted(
            [d for d in connection.owners.all()], key=lambda d: d.get('domain')
        ) == sorted(owners, key=lambda d: d.get('domain'))
        assert sorted(
            [d for d in connection.input_domains.all()], key=lambda d: d.get('domain')
        ) == sorted(domains, key=lambda d: d.get('domain'))
        assert sorted(
            [d for d in connection.ciphers.all()], key=lambda d: d.get('cipher')
        ) == sorted(ciphers, key=lambda d: d.get('cipher'))

        owners[0]['organization_en'] = 'Test'
        owners[0]['domain'] = 'a.domain.com'
        write_to_sio(owners_io, owner_writer, owners, True)

        domains[0]['domain'] = 'something.not.real.com'
        write_to_sio(domains_io, domain_writer, domains, True)

        ciphers[0]['cipher'] = 'MATH_IS_HARD'
        write_to_sio(ciphers_io, cipher_writer, ciphers, True)

        preprocess.update_data(owners_io, domains_io, ciphers_io, connection)
        docs = [d for d in connection.owners.all()]
        assert len(docs) == 3
        assert owners[0] in docs

        docs = [d for d in connection.input_domains.all()]
        assert len(docs) == 3
        assert domains[0] in docs

        docs = [d for d in connection.ciphers.all()]
        assert len(docs) == 3
        assert ciphers[0] in docs
