import csv
import copy
import datetime
import io
import typing
import pytest
from track import models


@pytest.fixture()
def app_setup(app) -> typing.Iterator[None]:
    with app.app_context():
        yield


@pytest.mark.usefixtures("app_setup")
def test_default_db_name() -> None:
    assert models.db.db.name.startswith('track')


@pytest.fixture()
def clean_model(app_setup): # pylint: disable=unused-argument
    yield models
    models.clear_database()


class TestReport():

    @pytest.fixture()
    def report_date(self) -> str: # pylint: disable=no-self-use
        return '2018-05-02'

    @pytest.fixture()
    def report(self, report_date: str) -> typing.Dict[str, typing.Any]: # pylint: disable=no-self-use
        return {
            "https" : {
                "eligible" : 29036,
                "uses" : 23788,
                "enforces" : 21932,
                "hsts" : 18583,
                "compliant" : 16940
            },
            "crypto" : {
                "eligible" : 23031,
                "bod_crypto" : 19894,
                "rc4" : 1055,
                "3des" : 3091,
                "sslv2" : 45,
                "sslv3" : 576,
                "accepted_ciphers": 351,
                "good_cert": 351,
            },
            "preloading" : {
                "eligible" : 1277,
                "preloaded" : 298,
                "preload_ready" : 103
            },
            "analytics" : {
                "eligible" : 744,
                "participating" : 463
            },
            "report_date" : report_date
        }

    def test_create_data_is_latest(self, clean_model, report): # pylint: disable=no-self-use
        clean_model.db.db.meta.insert_one({'_collection': 'reports', **report})
        assert clean_model.Report.latest() == report

    def test_report_time(self, report_date: str) -> None: # pylint: disable=no-self-use
        assert models.Report.report_time(report_date) == datetime.datetime(2018, 5, 2)


class TestDomain():

    @pytest.fixture()
    def domain(self) -> typing.Dict[str, typing.Any]: # pylint: disable=no-self-use
        return {
            'organization_name_en': 'Department of Test',
            'organization_name_fr': 'Department of French Test',
            'organization_slug': 'department-of-test',
            'analytics': {'eligible': True, 'participating': False},
            'base_domain': 'test.gc.ca',
            'branch': 'executive',
            'canonical': 'http://test.gc.ca',
            'domain': 'test.gc.ca',
            'exclude': {'analytics': False},
            'https': {
                '3des': False,
                'bod_crypto': 1,
                'compliant': 0,
                'eligible': True,
                'eligible_zone': True,
                'enforces': 1,
                'hsts': 0,
                'hsts_age': None,
                'preloaded': 0,
                'rc4': False,
                'sslv2': False,
                'sslv3': False,
                'accepted_ciphers': False,
                'bad_ciphers': ['TLS_DHE_RSA_WITH_3DES_EDE_CBC_SHA'],
                'tlsv10': False,
                'tlsv11': False,
                'good_cert': 1,
                'signature_algorithm': 'sha256',
                'uses': 2,
            },
            'is_parent': True,
            'live': True,
            'redirect': False,
            'sources': ['canada-gov'],
            'totals': {
                'crypto': {
                    '3des': 0,
                    'bod_crypto': 1,
                    'eligible': 1,
                    'rc4': 0,
                    'sslv2': 0,
                    'sslv3': 0,
                    'accepted_ciphers': 1,
                    'tlsv10': 0,
                    'tlsv11': 0,
                }, 'https': {
                    'compliant': 0,
                    'eligible': 1,
                    'enforces': 0,
                    'hsts': 0,
                    'uses': 1
                }
            }
        }

    def test_find(self, clean_model, domain) -> None: # pylint: disable=no-self-use
        clean_model.db.db.meta.insert_one({'_collection': 'domains', **domain})
        assert clean_model.Domain.find('test.gc.ca') == domain

    def test_eligible(self, clean_model, domain) -> None: # pylint: disable=no-self-use
        clean_model.db.db.meta.insert_one({'_collection': 'domains', **domain})
        clean_model.db.db.meta.insert_one({'_collection': 'domains', **domain})
        eligible_domains = [domain for domain in clean_model.Domain.eligible('https')]
        assert len(eligible_domains) == 2

    def test_eligible_parents(self, clean_model, domain) -> None: # pylint: disable=no-self-use
        clean_model.db.db.meta.insert_one({'_collection': 'domains', **domain})
        clean_model.db.db.meta.insert_one({'_collection': 'domains', **domain})

        eligible_parents = [domain for domain in clean_model.Domain.eligible_parents('https')]
        assert len(eligible_parents) == 2

    def test_eligible_for_domain(self, clean_model, domain) -> None: # pylint: disable=no-self-use
        clean_model.db.db.meta.insert_one({'_collection': 'domains', **domain})
        clean_model.db.db.meta.insert_one({'_collection': 'domains', **domain})

        eligible_for_domain = [domain for domain in clean_model.Domain.eligible_for_domain('test.gc.ca', 'https')]
        assert len(eligible_for_domain) == 2

    def test_all(self, clean_model, domain) -> None: # pylint: disable=no-self-use
        domain_one = domain.copy()
        domain_two = domain.copy()
        domain_one['domain'] = 'test1.test.gc.ca'
        domain_two['domain'] = 'test2.test.gc.ca'
        clean_model.db.db.meta.insert_one({'_collection': 'domains', **domain_one})
        clean_model.db.db.meta.insert_one({'_collection': 'domains', **domain_two})

        all_documents = [domain for domain in clean_model.Domain.all()]
        assert len(all_documents) == 2
        domains = {doc['domain'] for doc in all_documents}
        assert 'test1.test.gc.ca' in domains
        assert 'test2.test.gc.ca' in domains

    def test_to_csv_en(self, domain) -> None: # pylint: disable=no-self-use
        csv_string = models.Domain.to_csv([domain], 'https', 'en')
        bytes_in = io.BytesIO(csv_string)

        with io.TextIOWrapper(bytes_in, encoding='utf-8-sig', newline='') as wrapped_io:
            reader = csv.DictReader(wrapped_io)
            assert sorted(reader.fieldnames) == [
                '3DES',
                'Approved Certificate',
                'Base Domain',
                'Digital Signature Algorithm',
                'Domain',
                'Enforces HTTPS',
                'English Organization',
                'Free of known weak protocols and ciphers',
                'French Organization',
                'ITPIN Compliant',
                'Only Uses Supported Ciphers',
                'Preloaded',
                'RC4',
                'SSLv2',
                'SSLv3',
                'Sources',
                'Strict Transport Security (HSTS)',
                'TLSv1.0',
                'TLSv1.1',
                'URL',
                'Unsupported TLS Cipher Suites',
            ]
            assert next(reader) == {
                'Domain': 'test.gc.ca',
                'Base Domain': 'test.gc.ca',
                'URL': 'http://test.gc.ca',
                'English Organization': 'Department of Test',
                'French Organization': 'Department of French Test',
                'Sources': 'canada-gov',
                'ITPIN Compliant': 'No',
                'Only Uses Supported Ciphers': 'No',
                'Digital Signature Algorithm': 'sha256',
                'Enforces HTTPS': 'No',
                'Strict Transport Security (HSTS)': 'No',
                'Free of known weak protocols and ciphers': 'Yes',
                '3DES': 'No',
                'RC4': 'No',
                'SSLv2': 'No',
                'SSLv3': 'No',
                'TLSv1.0': 'No',
                'TLSv1.1': 'No',
                'Approved Certificate': 'Yes',
                'Preloaded': 'No',
                'Unsupported TLS Cipher Suites': 'TLS_DHE_RSA_WITH_3DES_EDE_CBC_SHA',
            }

    def test_to_csv_fr(self, domain) -> None: # pylint: disable=no-self-use
        csv_string = models.Domain.to_csv([domain], 'https', 'fr')
        bytes_in = io.BytesIO(csv_string)

        with io.TextIOWrapper(bytes_in, encoding='utf-8-sig', newline='') as wrapped_io:
            reader = csv.DictReader(wrapped_io)
            assert sorted(reader.fieldnames) == [
                '3DES',
                'Absence de protocoles ou de suites de chiffrement ayant des vulnérabilités connues',
                'Certificats approuvés',
                "Conforme à l'AMPTI",
                'Digital Signature Algorithm',
                'Domaine',
                'Domaine de base',
                'Exécute HTTPS',
                'Organisation anglaise',
                'Organisation française',
                'Préchargés',
                'RC4',
                'SSLv2',
                'SSLv3',
                'Sources',
                'Strict Transport Security (HSTS)',
                'Suites de chiffrement TLS non supportées',
                'TLSv1.0',
                'TLSv1.1',
                'URL',
                'Utilise des chiffrements supportés seulement',
            ]

            assert next(reader) == {
                'Domaine': 'test.gc.ca',
                'Domaine de base': 'test.gc.ca',
                'URL': 'http://test.gc.ca',
                'Organisation anglaise': 'Department of Test',
                'Organisation française': 'Department of French Test',
                'Sources': 'canada-gov',
                "Conforme à l'AMPTI": 'Non',
                'Utilise des chiffrements supportés seulement': 'Non',
                'Digital Signature Algorithm': 'sha256',
                'Exécute HTTPS': 'Non',
                'Strict Transport Security (HSTS)': 'Non',
                'Absence de protocoles ou de suites de chiffrement ayant des vulnérabilités connues': 'Oui',
                '3DES': 'Non',
                'RC4': 'Non',
                'SSLv2': 'Non',
                'SSLv3': 'Non',
                'TLSv1.0': 'Non',
                'TLSv1.1': 'Non',
                'Certificats approuvés': 'Oui',
                'Préchargés': 'Non',
                'Suites de chiffrement TLS non supportées': 'TLS_DHE_RSA_WITH_3DES_EDE_CBC_SHA',
            }


class TestOrganizations():

    @pytest.fixture()
    def organization(self) -> typing.Dict[str, typing.Any]: # pylint: disable=no-self-use
        return {
            "name_en": "Test Organization",
            "name_fr": "Test French Organization",
            "slug" : "test-organization",
            "branch" : "executive",
            "total_domains" : 3,
            "https" : {
                "eligible" : 4,
                "uses" : 2,
                "enforces" : 1,
                "hsts" : 2,
                "compliant" : 0
            },
            "crypto" : {
                "eligible" : 2,
                "bod_crypto" : 1,
                "rc4" : 0,
                "3des" : 1,
                "sslv2" : 0,
                "sslv3" : 0,
                "accepted_ciphers": 1,
                "tlsv10": 0,
                "tlsv11": 0,
                'good_cert': 2,
            },
            "preloading" : {
                "eligible" : 3,
                "preloaded" : 2,
                "preload_ready" : 0
            },
            "analytics" : {
                "eligible" : 3,
                "participating" : 1
            }
        }

    def test_eligible(self, clean_model, organization) -> None: # pylint: disable=no-self-use
        clean_model.db.db.meta.insert_one({'_collection': 'organizations', **organization})
        clean_model.db.db.meta.insert_one({'_collection': 'organizations', **organization})

        eligible = [organization for organization in clean_model.Organization.eligible('https')]
        assert len(eligible) == 2

    def test_not_eligible(self, clean_model, organization) -> None: # pylint: disable=no-self-use
        not_eligible = copy.deepcopy(organization)
        not_eligible['https']['eligible'] = 0
        clean_model.db.db.meta.insert_one({'_collection': 'organizations', **organization})
        clean_model.db.db.meta.insert_one({'_collection': 'organizations', **not_eligible})

        eligible = [organization for organization in clean_model.Organization.eligible('https')]
        assert len(eligible) == 1

    def test_find(self, clean_model, organization) -> None: # pylint: disable=no-self-use
        clean_model.db.db.meta.insert_one({'_collection': 'organizations', **organization})
        different = organization
        different['slug'] = 'test-organization2'
        clean_model.db.db.meta.insert_one({'_collection': 'organizations', **different})
        assert clean_model.Organization.find('test-organization')['slug'] == 'test-organization'

    def test_all(self, clean_model, organization) -> None: # pylint: disable=no-self-use
        clean_model.db.db.meta.insert_one({'_collection': 'organizations', **organization})
        clean_model.db.db.meta.insert_one({'_collection': 'organizations', **organization})
        all_organizations = [organization for organization in clean_model.Organization.all()]
        assert len(all_organizations) == 2


class TestFlag():

    def test_get_cache_not_set(self, clean_model) -> None: # pylint: disable=no-self-use
        assert clean_model.Flag.get_cache() == "1999-12-31 23:59"