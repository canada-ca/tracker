import os
import csv
from data import models


def pull_data(output: str, connection: models.Connection) -> None:
    os.makedirs(output, exist_ok=True)

    domain_path = os.path.join(output, 'domains.csv')
    subdomain_path = os.path.join(output, 'subdomains.csv')

    with open(domain_path, 'w', newline='', encoding='utf-8') as domain_file, \
         open(subdomain_path, 'w', newline='', encoding='utf-8') as subdomain_file:

        domain_writer = csv.DictWriter(
            domain_file,
            fieldnames=['domain', 'filler', 'organization_en', 'organization_fr']
        )
        subdomain_writer = csv.DictWriter(subdomain_file, fieldnames=['domain'])
        domain_writer.writeheader()
        subdomain_writer.writeheader()

        for document in connection.parents.all():
            domain_writer.writerow(document)
        for document in connection.subdomains.all():
            subdomain_writer.writerow(document)
