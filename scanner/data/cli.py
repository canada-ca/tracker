from itertools import zip_longest

import os
import typing
import datetime
import click

from azure.keyvault import KeyVaultClient
from msrestazure.azure_active_directory import MSIAuthentication

import ujson

from data import env
from data.env import DATA_DIR
from data import update as data_update
from data import processing
from data import logger
from data import models
from data.preprocess import pull_data, update_data


LOGGER = logger.get_logger(__name__)

# init Azure MSI & KeyVault creds

if os.environ.get("TRACKER_KEYVAULT_URI", None) is not None and os.environ.get("SECRET_NAME_RW", None) is not None:
    KV_URI = os.environ.get("TRACKER_KEYVAULT_URI")
    SECRET_NAME = os.environ.get("SECRET_NAME_RW")
    CREDS = MSIAuthentication(resource='https://vault.azure.net')
    KV_CLIENT = KeyVaultClient(CREDS)
    MONGO_URI = KV_CLIENT.get_secret(KV_URI, SECRET_NAME, "").value
else:
    MONGO_URI = os.environ.get("TRACKER_MONGO_URI", "mongodb://localhost:27017/track")

class DateType(click.ParamType):
    name = "date"

    def convert(self, value, param, ctx) -> typing.Optional[str]:
        try:
            datetime.datetime.strptime(value, "%Y-%m-%d")
            return value
        except ValueError:
            self.fail("{value} is not a valid date".format(value=value))


DATE = DateType()


def get_cached_date(directory: str) -> str:
    meta = os.path.join(directory, "output/domains/results/meta.json")
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
    for option, value in zip_longest(args, args[1:], fillvalue=""):
        if option.startswith("--"):
            name = option.strip("--")
            transformed[name] = value if value and not value.startswith("--") else True
    return transformed


@click.group()
@click.option(
    "--connection",
    type=str,
    default=MONGO_URI,
    help="Interact with the tracker scanning utility",
)
@click.option(
    "--batch-size",
    type=int,
    default=100,
    envvar="TRACKER_BATCH_SIZE",
    help="Manually batch uploads into groups of batch-size, enter 0 for no batching",
)
@click.pass_context
def main(ctx: click.core.Context, connection: str, batch_size: typing.Optional[str]) -> None:
    ctx.obj = {"connection_string": connection, "batch_size": batch_size}


@main.command(
    context_settings=dict(ignore_unknown_options=True),
    help="Coposition of `update`, `process`, and `upload` commands",
)
@click.option("--date", type=DATE, help="To specify the last scan date manually")
@click.option(
    "--scanner",
    type=str,
    multiple=True,
    default=["pshtt", "sslyze"],
    envvar="SCANNERS",
    help="A comma separated list of scanners to use",
)
@click.option(
    "--domains",
    type=click.Path(),
    default=env.DOMAINS,
    envvar="DOMAINS",
    help="Path to the domains list",
)
@click.option(
    "--output",
    type=click.Path(),
    default=env.SCAN_DATA,
    envvar="SCAN_DATA",
    help="Path to where to store scan results",
)
@click.argument("domain-scan-args", nargs=-1, type=click.UNPROCESSED)
@click.pass_context
def run(
        ctx: click.core.Context,  # pylint: disable=unused-argument
        date: typing.Optional[str],
        scanner: typing.List[str],
        domains: str,
        output: str,
        domain_scan_args: typing.List[str],
) -> None:

    scan.callback(scanner, domains, output, domain_scan_args)
    the_date = get_date(None, "date", date)
    process.callback(the_date)


@main.command(help="Download the input data from the database for use in scanning")
@click.option("--output", type=click.Path(), help="Where to store the data csvs")
@click.pass_context
def preprocess(ctx: click.core.Context, output: typing.Optional[str]) -> None:
    if not output:
        output = os.path.join(os.getcwd(), "csv")

    with models.Connection(ctx.obj.get("connection_string")) as connection:
        pull_data(output, connection)


@main.command(
    context_settings=dict(ignore_unknown_options=True), help="Scan domains list"
)
@click.option(
    "--scanner",
    type=str,
    multiple=True,
    default=["pshtt", "sslyze"],
    envvar="SCANNERS",
    help="A comma separated list of scanners to use",
)
@click.option(
    "--domains",
    type=click.Path(),
    default=env.DOMAINS,
    envvar="DOMAINS",
    help="Path to the csv of domains to scan",
)
@click.option(
    "--output",
    type=click.Path(),
    default=env.SCAN_DATA,
    envvar="SCAN_DATA",
    help="Where to store the scan results",
)
@click.argument("domain-scan-args", nargs=-1, type=click.UNPROCESSED)
def scan(
        scanner: typing.List[str],
        domains: str,
        output: str,
        domain_scan_args: typing.List[str],
) -> None:
    LOGGER.info("Starting scan")
    data_update.update(scanner, domains, output, transform_args(domain_scan_args))
    LOGGER.info("Finished scan")


@main.command(help="Process scan data")
@click.option(
    "--date",
    type=DATE,
    callback=get_date,
    help="To specify the last scan date manually",
)
@click.pass_context
def process(ctx: click.core.Context, date: str) -> None:
    # Sanity check to make sure we have what we need.
    if not os.path.exists(os.path.join(env.SCAN_RESULTS, "meta.json")):
        LOGGER.info("No scan metadata downloaded, aborting.")
        return

    LOGGER.info("[%s] Loading data into track-web.", date)
    processing.run(date, ctx.obj.get("connection_string"), ctx.obj.get("batch_size"))
    LOGGER.info("[%s] Data now loaded into track-web.", date)


@main.command(help="Update DB with modifications to domains and owners list")
@click.option(
    "--owners",
    type=click.File("r", encoding="utf-8-sig"),
    help="Path to csv of domain owners",
)
@click.option(
    "--domains",
    type=click.File("r", encoding="utf-8-sig"),
    help="Path to csv of domains",
)
@click.option(
    "--ciphers",
    type=click.File("r", encoding="utf-8-sig"),
    help="Path to csv of ciphers",
)
@click.pass_context
def update(
        ctx: click.core.Context,
        owners: typing.IO[str],
        domains: typing.IO[str],
        ciphers: typing.IO[str]
) -> None:

    with models.Connection(ctx.obj.get("connection_string")) as connection:
        update_data(owners, domains, ciphers, connection)
        LOGGER.info("'tracker update' completed.")
