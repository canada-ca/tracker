import csv
import functools
import os
import typing
from data import models


def pull_data(output: str, connection: models.Connection) -> None:
    os.makedirs(output, exist_ok=True)

    domain_path = os.path.join(output, 'domains.csv')
    owner_path = os.path.join(output, 'owners.csv')
    cipher_path = os.path.join(output, 'ciphers.csv')

    with open(domain_path, 'w', newline='', encoding='utf-8') as domain_file, \
         open(owner_path, 'w', newline='', encoding='utf-8') as owner_file, \
         open(cipher_path, 'w', newline='', encoding='utf-8') as cipher_file:

        owner_writer = csv.DictWriter(
            owner_file,
            fieldnames=['domain', 'organization_en', 'organization_fr'],
            extrasaction='ignore'
        )
        domain_writer = csv.DictWriter(domain_file, fieldnames=['domain'])
        cipher_writer = csv.DictWriter(cipher_file, fieldnames=['cipher'])
        domain_writer.writeheader()
        owner_writer.writeheader()
        cipher_writer.writeheader()

        for document in connection.owners.all():
            owner_writer.writerow(document)
        for document in connection.input_domains.all():
            domain_writer.writerow(document)
        for document in connection.ciphers.all():
            cipher_writer.writerow(document)


def insert_data(
        owners: typing.Optional[typing.IO[str]],
        domains: typing.Optional[typing.IO[str]],
        ciphers: typing.Optional[typing.IO[str]],
        upsert: bool,
        connection: models.Connection,
        batch_size: typing.Optional[int] = None,
    ) -> None:

    insertions = []

    if owners:
        insertions.append(('owners', 'domain', csv.DictReader(owners)))
    if domains:
        insertions.append(('input_domains', 'domain', csv.DictReader(domains)))
    if ciphers:
        insertions.append(('ciphers', 'cipher', csv.DictReader(ciphers)))

    for collection_name, key, reader in insertions:
        collection = getattr(connection, collection_name)
        if upsert:
            method = functools.partial(collection.upsert_all, key_column=key, batch_size=batch_size)
        else:
            method = functools.partial(collection.create_all, batch_size=batch_size)
        method(document for document in reader)
