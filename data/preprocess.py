import csv
import functools
import os
import typing
from data import models
from data import logger

LOGGER = logger.get_logger(__name__)

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
        domain_writer = csv.DictWriter(domain_file, fieldnames=['domain'], extrasaction='ignore')
        cipher_writer = csv.DictWriter(cipher_file, fieldnames=['cipher'], extrasaction='ignore')
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

def update_data(
        owners: typing.Optional[typing.IO[str]],
        domains: typing.Optional[typing.IO[str]],
        ciphers: typing.Optional[typing.IO[str]],
        connection: models.Connection
    ) -> None:

    if domains:
        # get new list of input_domains
        input_reader = csv.DictReader(domains)
        new_domains = [record['domain'] for record in input_reader]

        # get remote list of input_domains
        remote_in_domains = [document['domain'] for document in connection.input_domains.all()]

        # use set logic to find the set of input_domains that need to be removed
        id_removals = set(remote_in_domains) - set(new_domains)
        # use set logic to find the set of input_domains that need to be added
        id_additions = set(new_domains)  - set(remote_in_domains)


        LOGGER.info("Input Domain additions: %s", id_additions)
        LOGGER.info("Input Domain removals: %s", id_removals)

        # Delete domain results from 'domains' table
        for record in id_removals:
            resp = connection.domains.delete_one({"domain":record})
            if resp.deleted_count != 1:
                LOGGER.error("Failed deletion of domain from 'domains': %s", record)

        # Delete and Insert updated domains into 'input_domains' table
        for record in id_removals:
            resp = connection.input_domains.delete_one({'domain':record})
            if resp.deleted_count != 1:
                LOGGER.error("Failed deletion of domain from 'input_domains': %s", record)

        for record in id_additions:
            connection.input_domains.create({'domain':record})

    if owners:
        # Get updated list of owners
        owner_reader = csv.DictReader(owners)
        new_owners = [(record) for record in owner_reader]
        new_owners_set = []
        for record in new_owners:
            temp = []
            for _, value in record.items():
                temp.append(value)
            new_owners_set.append(tuple(temp))

        # Get the remote list of owners
        remote_owners = [
            (document['domain'],
             document['organization_en'],
             document['organization_fr'])
            for document in connection.owners.all()]

        # additions : new list - old list
        # removals : old list - new list
        owner_additions = set(new_owners_set) - set(remote_owners)
        owner_removals = set(remote_owners) - set(new_owners_set)
        LOGGER.info("Owner additions: %s", owner_additions)
        LOGGER.info("Owner removals: %s", owner_removals)

        # find matching removals (modifications)
        mods = []
        for removal in owner_removals:
            srch = removal[0] # this is the domain
            for addition in owner_additions:
                if srch == addition[0]:
                    # matching domain, we call this a modification
                    mods.append([addition, removal])

        # we'll want to zip through the modifications records, with the old domains,
        # query into the domains table, then replace with the new records.
        for record in mods:
            oldorg_en = record[1][1] # old record, (domain, *english, french)
            oldorg_fr = record[1][2] # same as above, mais en francais
            for doc in connection.domains.find_with_id(
                    {"domain": record[1][0],
                     "organization_name_en":oldorg_en,
                     "organization_name_fr":oldorg_fr}):

                doc["organization_name_en"] = record[0][1]
                doc["organization_name_fr"] = record[0][2]
                connection.domains.replace({"_id":doc['_id']}, doc)
                LOGGER.warning("Org names modified for 'domains' record: [%s]", record[1][0])

        # remove owners
        for record in owner_removals:
            connection.owners.delete_one({
                "domain":record[0],
                "organization_en":record[1],
                "organization_fr":record[2]})
            LOGGER.info("Removed owner.. %s", record)

        # add new owners
        for record in owner_additions:
            connection.owners.create({
                "domain":record[0],
                "organization_en":record[1],
                "organization_fr":record[2]})
            LOGGER.info("Created owner.. %s", record)

    if ciphers:
        # get local list of ciphers
        input_reader = csv.DictReader(ciphers)
        local_ciphers = [record['cipher'] for record in input_reader]

        # get remote list of input_domains
        remote_ciphers = [document['cipher'] for document in connection.ciphers.all()]

        # use set logic to find the set of ciphers that need to be removed
        removals = set(remote_ciphers) - set(local_ciphers)
        # use set logic to find the set of ciphers that need to be added
        additions = set(local_ciphers)  - set(remote_ciphers)


        LOGGER.info("Cipher additions: %s", additions)
        LOGGER.info("Cipher removals: %s", removals)

        # remove ciphers
        for record in removals:
            connection.ciphers.delete_one({"cipher":record})
            LOGGER.info("Removed cipher.. %s", record)

        # add new ciphers
        for record in additions:
            connection.ciphers.create({"cipher":record})
            LOGGER.info("Created cipher.. %s", record)

        LOGGER.warning("'Track Web results will show old cipher compliance results"
                       " until a new 'tracker run' is completed.")
