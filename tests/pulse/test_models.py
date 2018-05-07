import csv
import copy
import datetime
import io
import typing
import pytest
from pulse import models


@pytest.fixture()
def app_setup(app) -> typing.Iterator[None]:
    with app.app_context():
        yield


@pytest.mark.usefixtures("app_setup")
def test_default_db_name() -> None:
    assert models.db.db.name.startswith('pulse')


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
                "m1513" : 17784,
                "compliant" : 16940
            },
            "crypto" : {
                "eligible" : 23031,
                "bod_crypto" : 19894,
                "rc4" : 1055,
                "3des" : 3091,
                "sslv2" : 45,
                "sslv3" : 576
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

    def test_create_data(self, clean_model, report): # pylint: disable=no-self-use
        clean_model.Report.create(report)
        assert clean_model.db.db.reports.count() == 1
        assert clean_model.db.db.reports.find_one()['https']['eligible'] == 29036

    def test_create_data_is_latest(self, clean_model, report): # pylint: disable=no-self-use
        clean_model.Report.create(report)
        assert clean_model.Report.latest() == report

    def test_report_time(self, report_date: str) -> None: # pylint: disable=no-self-use
        assert models.Report.report_time(report_date) == datetime.datetime(2018, 5, 2)


class TestDomain():

    @pytest.fixture()
    def domain(self) -> typing.Dict[str, typing.Any]: # pylint: disable=no-self-use
        return {
            'agency_name': 'Department of Test',
            'agency_slug': 'department-of-test',
            'analytics': {'eligible': True, 'participating': False},
            'base_domain': 'test.gc.ca',
            'branch': 'executive',
            'canonical': 'http://test.gc.ca',
            'domain': 'test.gc.ca',
            'exclude': {'analytics': False},
            'https': {
                '3des': False,
                'bod_crypto': 1,
                'compliant': False,
                'eligible': True,
                'eligible_zone': True,
                'enforces': 1,
                'hsts': 0,
                'hsts_age': None,
                'm1513': False,
                'preloaded': 0,
                'rc4': False,
                'sslv2': False,
                'sslv3': False,
                'uses': 2
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
                    'sslv3': 0},
                'https': {
                    'compliant': 0,
                    'eligible': 1,
                    'enforces': 0,
                    'hsts': 0,
                    'm1513': 0,
                    'uses': 1
                }
            }
        }

    def test_create(self, clean_model, domain) -> None: # pylint: disable=no-self-use
        clean_model.Domain.create(domain)
        assert clean_model.db.db.domains.count() == 1
        assert clean_model.Domain.find('test.gc.ca')['agency_name'] == 'Department of Test'

    def test_create_all(self, clean_model, domain) -> None: # pylint: disable=no-self-use
        clean_model.Domain.create_all([domain.copy(), domain.copy(), domain.copy()])
        assert clean_model.db.db.domains.count() == 3

    def test_update(self, clean_model, domain) -> None: # pylint: disable=no-self-use
        clean_model.Domain.create(domain)
        clean_model.Domain.update('test.gc.ca', {'agency_name': 'Department of NotTest'})
        assert clean_model.Domain.find('test.gc.ca')['agency_name'] == 'Department of NotTest'

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
            assert reader.fieldnames == [
                'Domain',
                'Base Domain',
                'URL',
                'Agency',
                'Sources',
                'Compliant with M-15-13 and BOD 18-01',
                'Enforces HTTPS',
                'Strict Transport Security (HSTS)',
                'Free of RC4/3DES and SSLv2/SSLv3',
                '3DES',
                'RC4',
                'SSLv2',
                'SSLv3',
                'Preloaded'
            ]
            assert next(reader) == {
                'Domain': 'test.gc.ca',
                'Base Domain': 'test.gc.ca',
                'URL': 'http://test.gc.ca',
                'Agency': 'Department of Test',
                'Sources': 'canada-gov',
                'Compliant with M-15-13 and BOD 18-01': 'No',
                'Enforces HTTPS': 'No',
                'Strict Transport Security (HSTS)': 'No',
                'Free of RC4/3DES and SSLv2/SSLv3': 'Yes',
                '3DES': 'No',
                'RC4': 'No',
                'SSLv2': 'No',
                'SSLv3': 'No',
                'Preloaded': 'No'
            }


class TestAgencies():

    @pytest.fixture()
    def agency(self) -> typing.Dict[str, typing.Any]: # pylint: disable=no-self-use
        return {
            "name" : "Test Organization",
            "slug" : "test-organization",
            "branch" : "executive",
            "total_domains" : 3,
            "https" : {
                "eligible" : 4,
                "uses" : 2,
                "enforces" : 1,
                "hsts" : 2,
                "m1513" : 1,
                "compliant" : 0
            },
            "crypto" : {
                "eligible" : 2,
                "bod_crypto" : 1,
                "rc4" : 0,
                "3des" : 1,
                "sslv2" : 0,
                "sslv3" : 0
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

    def test_create(self, clean_model, agency) -> None: # pylint: disable=no-self-use
        clean_model.Agency.create(agency)
        assert clean_model.db.db.agencies.count() == 1
        assert clean_model.db.db.agencies.find_one()['name'] == 'Test Organization'


    def test_create_all(self, clean_model, agency) -> None: # pylint: disable=no-self-use
        clean_model.Agency.create_all([agency.copy(), agency.copy(), agency.copy()])
        assert clean_model.db.db.agencies.count() == 3


    def test_eligible(self, clean_model, agency) -> None: # pylint: disable=no-self-use
        clean_model.Agency.create(agency)
        clean_model.Agency.create(agency)

        eligible = [agency for agency in clean_model.Agency.eligible('https')]
        assert len(eligible) == 2

    def test_not_eligible(self, clean_model, agency) -> None: # pylint: disable=no-self-use
        not_eligible = copy.deepcopy(agency)
        not_eligible['https']['eligible'] = 0
        clean_model.Agency.create_all([agency, not_eligible])

        eligible = [agency for agency in clean_model.Agency.eligible('https')]
        assert len(eligible) == 1

    def test_add_report(self, clean_model, agency) -> None: # pylint: disable=no-self-use
        clean_model.Agency.create(agency)
        clean_model.Agency.add_report('test-organization', 'test_report', {'key': 'value'})
        assert clean_model.Agency.find('test-organization').get('test_report') == {'key': 'value'}

    def test_find(self, clean_model, agency) -> None: # pylint: disable=no-self-use
        clean_model.Agency.create(agency)
        different = agency.copy()
        different['slug'] = 'test-organization2'
        clean_model.Agency.create(different)
        assert clean_model.Agency.find('test-organization')['slug'] == 'test-organization'

    def test_all(self, clean_model, agency) -> None: # pylint: disable=no-self-use
        clean_model.Agency.create(agency)
        clean_model.Agency.create(agency)
        all_agencies = [agency for agency in clean_model.Agency.all()]
        assert len(all_agencies) == 2
