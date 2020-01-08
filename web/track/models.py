import io
import datetime
import csv
import typing
from flask_pymongo import PyMongo
from pymongo.errors import PyMongoError
import track.data

# These functions are meant to be the only ones that access the g.db.db
# directly. If we ever decide to migrate from tinyg.db.db, that can all be
# coordinated here.

db = PyMongo()
QueryError = PyMongoError

# Data loads should clear the entire database first.
def clear_database():
    db.cx.drop_database(db.db)


class Report:
    # report_date (string, YYYY-MM-DD)
    # https.eligible (number)
    # https.uses (number)
    # https.enforces (number)
    # https.hsts (number)
    # https.bod (number)

    @staticmethod
    def report_time(report_date: str) -> datetime.datetime:
        return datetime.datetime.strptime(report_date, "%Y-%m-%d")

    @staticmethod
    # There's only ever one.
    def latest() -> typing.Dict:
        return db.db.meta.find_one({'_collection': 'reports'}, {'_id': False, '_collection': False})


class Domain:
    # domain (string)
    # organization_slug (string)
    # is_parent (boolean)
    #
    # organization_name_en (string)
    # organization_name_fr (string)
    #
    # parent_domain (string)
    # sources (array of strings)
    #
    # live? (boolean)
    # redirect? (boolean)
    # canonical (string, URL)
    #
    # totals: {
    #   https: { ... }
    #   crypto: { ... }
    # }
    #
    # https: { ... }
    #
    @staticmethod
    def find(domain_name: str) -> typing.Dict:
        return db.db.meta.find_one(
            {
                '_collection': 'domains',
                'domain': domain_name
            }, {
                '_id': False,
                '_collection': False
            }
        )

    @staticmethod
    def find_all(query: typing.Dict, projection: typing.Dict = {'_id': False, '_collection': False}) -> typing.Dict:
        return db.db.meta.find(
            {
                '_collection': 'domains',
                **query,
            }, projection,
        )

    # Useful when you want to pull in all domain entries as peers,
    # such as reports which only look at parent domains, or
    # a flat CSV of all hostnames that match a report.
    @staticmethod
    def eligible(report_name: str) -> typing.Iterable[typing.Dict]:
        return db.db.meta.find(
            {
                '_collection': 'domains',
                '{}.eligible'.format(report_name): True
            }, {
                '_id': False,
                '_collection': False
            }
        )

    # Useful when you have mixed parent/subdomain reporting,
    # used for HTTPS but not yet others.
    @staticmethod
    def eligible_parents(report_name: str) -> typing.Iterable[typing.Dict]:
        return db.db.meta.find(
            {
                '_collection': 'domains',
                '{}.eligible_zone'.format(report_name): True,
                'is_parent': True
            }, {
                '_id': False,
                '_collection': False
            }
        )

    # Useful when you want to pull down subdomains of a particular
    # parent domain. Used for HTTPS expanded reports.
    @staticmethod
    def eligible_for_domain(domain: str, report_name: str) -> typing.Iterable[typing.Dict]:
        return db.db.meta.find(
            {
                '_collection': 'domains',
                '{}.eligible'.format(report_name): True,
                'base_domain': domain
            }, {
                '_id': False,
                '_collection': False
            }
        )

    @staticmethod
    def all() -> typing.Iterable[typing.Dict]:
        return db.db.meta.find({'_collection': 'domains'}, {'_id': False, '_collection': False})

    @staticmethod
    def to_csv(domains: typing.Iterable[typing.Dict], report_type: str, language: str) -> bytes:
        if report_type not in track.data.CSV_FIELDS:
            return {}

        output = io.BytesIO()
        iowrap = io.TextIOWrapper(output, encoding='utf-8-sig', newline='', write_through=True)

        writer = csv.writer(iowrap, quoting=csv.QUOTE_NONNUMERIC)

        def value_for(value: typing.Union[str, list, bool]) -> str:
            # if it's a list, convert it to a list of strings and join
            if isinstance(value, list):
                value = [str(x) for x in value]
                value = ", ".join(value)
            elif isinstance(value, bool):
                if language == 'en':
                    value = {True: 'Yes', False: 'No'}[value]
                else:
                    value = {True: 'Oui', False: 'Non'}[value]

            return value

        # initialize with a header row
        header = []

        # Common fields, and report-specific fields
        for category in ['common', report_type]:
            for field in track.data.CSV_FIELDS[category]:
                if language == 'en':
                    header.append(track.data.LABELS[category][field].english)
                else:
                    header.append(track.data.LABELS[category][field].french)

        writer.writerow(header)

        for domain in domains:
            row = []

            # Common fields, and report-specific fields
            for category in ['common', report_type]:

                # Currently, all report-specific fields use a mapping
                for field in track.data.CSV_FIELDS[category]:

                    # common fields are top-level on Domain objects
                    if category == 'common':
                        value = domain.get(field)
                    else:
                        value = domain[report_type].get(field)

                    # If a mapping exists e.g. 1 -> "Yes", etc.
                    if (
                            track.data.FIELD_MAPPING.get(category) and
                            track.data.FIELD_MAPPING[category].get(field) and
                            (track.data.FIELD_MAPPING[category][field].get(value) is not None)
                        ):
                        if language == 'en':
                            value = track.data.FIELD_MAPPING[category][field][value].english
                        else:
                            value = track.data.FIELD_MAPPING[category][field][value].french


                    row.append(value_for(value))

            writer.writerow(row)

        return output.getvalue()


class Organization:
    # organization_slug (string)
    # organization_name (string)
    # total_domains (number)
    #
    # https {
    #   eligible (number)
    #   uses (number)
    #   enforces (number)
    #   hsts (number)
    #   modern (number)
    #   preloaded (number)
    # }
    #

    # An organization which had at least 1 eligible domain.
    @staticmethod
    def eligible(report_name: str) -> typing.Iterable[typing.Dict]:
        return db.db.meta.find({
            '_collection': 'organizations',
            '{}.eligible'.format(report_name): {'$gt': 0}
        }, {
            '_id': False,
            '_collection': False
        })

    @staticmethod
    def find(slug: str) -> typing.Dict:
        return db.db.meta.find_one({'_collection': 'organizations', 'slug': slug}, {'_id': False, '_collection': False})

    @staticmethod
    def find_all(query: typing.Dict, projection: typing.Dict = {'_id': False, '_collection': False}) -> typing.Dict:
        return db.db.meta.find(
            {
                '_collection': 'organizations',
                **query,
            }, projection
        )

    @staticmethod
    def all() -> typing.Iterable[typing.Dict]:
        return db.db.meta.find({'_collection': 'organizations'}, {'_id': False, '_collection': False})


class Flag:

    @staticmethod
    def get_cache() -> str:
        flags = db.db.meta.find_one({"_collection": "flags"})
        return flags['cache'] if flags else "1999-12-31 23:59"
