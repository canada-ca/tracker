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
def main() -> None:
    pass


@main.command(
    context_settings=dict(ignore_unknown_options=True),
    help="Coposition of `update`, `process`, and `upload` commands",
)
@click.option("--date", type=DATE)
@click.option("--scan", type=click.Choice(["skip", "download", "here"]), default="skip")
@click.option("--gather", type=click.Choice(["skip", "here"]), default="here")
@click.option("--upload-results", is_flag=True, default=False)
@click.option("--environment", type=str, default="development", envvar="PULSE_ENV")
@click.argument("scan_args", nargs=-1, type=click.UNPROCESSED)
def run(
        date: typing.Optional[str],
        scan: str,
        gather: str,
        upload_results: bool,
        environment: str,
        scan_args: typing.List[str],
    ) -> None:

    update.callback(scan, gather, scan_args)
    the_date = get_date(None, "date", date)
    process.callback(the_date, environment)
    if upload_results:
        upload.callback(the_date)


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


@main.command(help="Download scan results from s3")
def download() -> None:
    LOGGER.info("Downloading production data")
    data_update.download_s3()
    LOGGER.info("Finished downloading production data")


@main.command(help="Upload scan results to s3")
@click.option("--date", type=DATE, callback=get_date)
def upload(date: str) -> None:
    # Sanity check to make sure we have what we need.
    if not os.path.exists(os.path.join(PARENTS_RESULTS, "meta.json")):
        LOGGER.info("No scan metadata downloaded, aborting.")
        return

    LOGGER.info(f"[{date}] Syncing scan data and database to S3.")
    data_update.upload_s3(date)
    LOGGER.info(f"[{date}] Scan data and database now in S3.")


@main.command(help="Process scan data")
@click.option("--date", type=DATE, callback=get_date)
@click.option("--environment", type=str, default="development", envvar="PULSE_ENV")
def process(date: str, environment: str) -> None:

    # Sanity check to make sure we have what we need.
    if not os.path.exists(os.path.join(PARENTS_RESULTS, "meta.json")):
        LOGGER.info("No scan metadata downloaded, aborting.")
        return

    LOGGER.info(f"[{date}] Loading data into Pulse.")
    processing.run(date, environment)
    LOGGER.info(f"[{date}] Data now loaded into Pulse.")
