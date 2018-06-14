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
        clean_model.Report.create(report)
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

    def test_create(self, clean_model, domain) -> None: # pylint: disable=no-self-use
        clean_model.Domain.create(domain)
        assert len([document for document in clean_model.Domain.all()]) == 1
        assert clean_model.Domain.find('test.gc.ca')['organization_name_en'] == 'Department of Test'

    def test_create_all(self, clean_model, domain) -> None: # pylint: disable=no-self-use
        clean_model.Domain.create_all([domain.copy(), domain.copy(), domain.copy()])
        assert len([document for document in clean_model.Domain.all()]) == 3

    def test_update(self, clean_model, domain) -> None: # pylint: disable=no-self-use
        clean_model.Domain.create(domain)
        clean_model.Domain.update('test.gc.ca', {'organization_name_en': 'Department of NotTest'})
        assert clean_model.Domain.find('test.gc.ca')['organization_name_en'] == 'Department of NotTest'

    def test_add_report(self, clean_model, domain) -> None: # pylint: disable=no-self-use
        clean_model.Domain.create(domain)
        clean_model.Domain.add_report('test.gc.ca', 'test_report', {'key': 'value'})
        assert clean_model.Domain.find('test.gc.ca').get('test_report') == {'key': 'value'}

    def test_find(self, clean_model, domain) -> None: # pylint: disable=no-self-use
        clean_model.Domain.create(domain)
        assert clean_model.Domain.find('test.gc.ca') == domain

    def test_eligible(self, clean_model, domain) -> None: # pylint: disable=no-self-use
        clean_model.Domain.create(domain)
        clean_model.Domain.create(domain)
        eligible_domains = [domain for domain in clean_model.Domain.eligible('https')]
        assert len(eligible_domains) == 2

    def test_eligible_parents(self, clean_model, domain) -> None: # pylint: disable=no-self-use
        clean_model.Domain.create(domain)
        clean_model.Domain.create(domain)

        eligible_parents = [domain for domain in clean_model.Domain.eligible_parents('https')]
        assert len(eligible_parents) == 2

    def test_eligible_for_domain(self, clean_model, domain) -> None: # pylint: disable=no-self-use
        clean_model.Domain.create(domain)
        clean_model.Domain.create(domain)

        eligible_for_domain = [domain for domain in clean_model.Domain.eligible_for_domain('test.gc.ca', 'https')]
        assert len(eligible_for_domain) == 2

    def test_all(self, clean_model, domain) -> None: # pylint: disable=no-self-use
        domain_one = domain.copy()
        domain_two = domain.copy()
        domain_one['domain'] = 'test1.test.gc.ca'
        domain_two['domain'] = 'test2.test.gc.ca'
        clean_model.Domain.create_all([domain_one, domain_two])

        all_documents = [domain for domain in clean_model.Domain.all()]
        assert len(all_documents) == 2
        domains = {doc['domain'] for doc in all_documents}
        assert 'test1.test.gc.ca' in domains
        assert 'test2.test.gc.ca' in domains

    def test_to_csv(self, domain) -> None: # pylint: disable=no-self-use
        csv_string = models.Domain.to_csv([domain], 'https')
        with io.StringIO() as sio:
            sio.write(csv_string)
            sio.seek(0)
            reader = csv.DictReader(sio)
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

    def test_create(self, clean_model, organization) -> None: # pylint: disable=no-self-use
        clean_model.Organization.create(organization)
        assert len([document for document in clean_model.Organization.all()]) == 1
        assert clean_model.Organization.find('test-organization')['name_en'] == 'Test Organization'


    def test_create_all(self, clean_model, organization) -> None: # pylint: disable=no-self-use
        clean_model.Organization.create_all([organization.copy(), organization.copy(), organization.copy()])
        assert len([document for document in clean_model.Organization.all()]) == 3


    def test_eligible(self, clean_model, organization) -> None: # pylint: disable=no-self-use
        clean_model.Organization.create(organization)
        clean_model.Organization.create(organization)

        eligible = [organization for organization in clean_model.Organization.eligible('https')]
        assert len(eligible) == 2

    def test_not_eligible(self, clean_model, organization) -> None: # pylint: disable=no-self-use
        not_eligible = copy.deepcopy(organization)
        not_eligible['https']['eligible'] = 0
        clean_model.Organization.create_all([organization, not_eligible])

        eligible = [organization for organization in clean_model.Organization.eligible('https')]
        assert len(eligible) == 1

    def test_add_report(self, clean_model, organization) -> None: # pylint: disable=no-self-use
        clean_model.Organization.create(organization)
        clean_model.Organization.add_report('test-organization', 'test_report', {'key': 'value'})
        assert clean_model.Organization.find('test-organization').get('test_report') == {'key': 'value'}

    def test_find(self, clean_model, organization) -> None: # pylint: disable=no-self-use
        clean_model.Organization.create(organization)
        different = organization.copy()
        different['slug'] = 'test-organization2'
        clean_model.Organization.create(different)
        assert clean_model.Organization.find('test-organization')['slug'] == 'test-organization'

    def test_all(self, clean_model, organization) -> None: # pylint: disable=no-self-use
        clean_model.Organization.create(organization)
        clean_model.Organization.create(organization)
        all_organizations = [organization for organization in clean_model.Organization.all()]
        assert len(all_organizations) == 2
