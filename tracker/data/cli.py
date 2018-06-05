import csv
import os
import typing
import datetime
import click
import ujson
from data.env import PARENTS_RESULTS
from data.env import DATA_DIR
from data import update as data_update
from data import processing
from data import logger
from data import models
from data.preprocess import pull_data


LOGGER = logger.get_logger(__name__)


class DateType(click.ParamType):
    name = "date"

    def convert(self, value, param, ctx) -> typing.Optional[str]:
        try:
            datetime.datetime.strptime(value, "%Y-%m-%d")
            return value
        except ValueError:
            self.fail(f"{value} is not a valid date")
DATE = DateType()


def get_cached_date(directory: str) -> str:
    meta = os.path.join(directory, "output/parents/results/meta.json")
    with open(meta) as meta_file:
        scan_meta = ujson.load(meta_file)
    return scan_meta["start_time"][0:10]


def get_date(
        ctx: typing.Optional[click.core.Context],  # pylint: disable=unused-argument
        param: typing.Optional[click.core.Option],  # pylint: disable=unused-argument
        value: typing.Optional[str],
    ) -> str:
    return value if value is not None else get_cached_date(DATA_DIR)


# Convert ["--option", "value", ... ] to {"option": "value", ...}
def transform_args(args: typing.List[str]) -> typing.Dict[str, typing.Union[str, bool]]:
    transformed = {}
    for option, value in zip(args, args[1:]):
        if option.startswith("--"):
            name = option.strip("--")
            transformed[name] = value if not value.startswith("--") else True
    return transformed


@click.group()
@click.option("--connection", type=str, default="mongodb://localhost:27017/track", envvar="TRACKER_MONGO_URI")
@click.pass_context
def main(ctx: click.core.Context, connection: str) -> None:
    ctx.obj = {
        'connection_string': connection
    }


@main.command(
    context_settings=dict(ignore_unknown_options=True),
    help="Coposition of `update`, `process`, and `upload` commands",
)
@click.option("--date", type=DATE)
@click.option("--scan", type=click.Choice(["skip", "here"]), default="skip")
@click.option("--gather", type=click.Choice(["skip", "here"]), default="here")
@click.argument("scan_args", nargs=-1, type=click.UNPROCESSED)
@click.pass_context
def run(
        ctx: click.core.Context,
        date: typing.Optional[str],
        scan: str,
        gather: str,
        scan_args: typing.List[str],
    ) -> None:

    update.callback(scan, gather, scan_args)
    the_date = get_date(None, "date", date)
    process.callback(the_date)


@main.command()
@click.option("--output", type=click.Path())
@click.pass_context
def preprocess(ctx: click.core.Context, output: typing.Optional[str]) -> None:
    if not output:
        output = os.path.join(os.getcwd(), 'csv')

    with models.Connection(ctx.obj.get('connection_string')) as connection:
        pull_data(output, connection)


@main.command(
    context_settings=dict(ignore_unknown_options=True), help="Gather and scan domains"
)
@click.option("--scan", type=click.Choice(["skip", "download", "here"]), default="skip")
@click.option("--gather", type=click.Choice(["skip", "here"]), default="here")
@click.argument("scan_args", nargs=-1, type=click.UNPROCESSED)
def update(scan: str, gather: str, scan_args: typing.List[str]) -> None:
    LOGGER.info("Starting update")
    data_update.update(scan, gather, transform_args(scan_args))
    LOGGER.info("Finished update")


@main.command(help="Process scan data")
@click.option("--date", type=DATE, callback=get_date)
@click.pass_context
def process(ctx: click.core.Context, date: str) -> None:
    # Sanity check to make sure we have what we need.
    if not os.path.exists(os.path.join(PARENTS_RESULTS, "meta.json")):
        LOGGER.info("No scan metadata downloaded, aborting.")
        return

    LOGGER.info(f"[{date}] Loading data into track-digital.")
    processing.run(date, ctx.obj.get('connection_string'))
    LOGGER.info(f"[{date}] Data now loaded into track-digital.")


@main.command(help="Populate DB with domains")
@click.option('--parents', type=click.File('r'))
@click.option('--subdomains', type=click.File('r'))
@click.pass_context
def insert(ctx: click.core.Context, parents: typing.IO[str], subdomains: typing.IO[str]) -> None:
    parents_reader = csv.DictReader(parents)
    subdomain_reader = csv.DictReader(subdomains)

    def relevant_parent(document: typing.Dict) -> typing.Dict:
        return {
            'domain': document.get('domain'),
            'organization_en': document.get('organization_en'),
            'organization_fr': document.get('organization_fr'),
        }

    def relevant_subdomain(document: typing.Dict) -> typing.Dict:
        return {
            'domain': document.get('domain'),
        }

    with models.Connection(ctx.obj.get('connection_string')) as connection:
        connection.parents.create_all(relevant_parent(document) for document in parents_reader)
        connection.subdomains.create_all(relevant_subdomain(document) for document in subdomain_reader)
