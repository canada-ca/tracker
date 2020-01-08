##
# This file must be run as a module in order for it to access
# modules in sibling directories.
#
# Run with:
#   python -m data.update

import subprocess
import typing

# Import all the constants from data/env.py.
from data import env

from data import logger

LOGGER = logger.get_logger(__name__)


# Orchestrate the overall regular Tracker update process.
#
# Steps:
#
# 1. Kick off domain-scan to scan each domain for each measured thing.
#    - Should drop results into data/output/parents (or a symlink).
#    - If exits with non-0 code, this should exit with non-0 code.
#
# 1a. Subdomains.
#    - Gather latest subdomains from public sources, into one condensed deduped file.
#    - Run pshtt and sslyze on gathered subdomains.
#    - This creates 2 resulting CSVs: pshtt.csv and sslyze.csv
#
# 2. Run processing.py to generate front-end-ready data as data/db.json.
#


# Options:
# scanners
#     list of scanners to use
# domains
#     location of domain list to scan
# output
#     location to store scan output
# options
#     options to pass along to scan and gather operations

def update(scanners: typing.List[str], domains: str, output: str, options):
    scan_command = env.SCAN_COMMAND

    # 1c. Scan domains for all types of things.
    LOGGER.info("Scanning domains.")
    scan_domains(options, scan_command, scanners, domains, output)
    LOGGER.info("Scan of domains complete.")


# Run pshtt on each gathered set of domains.
def scan_domains(
        options: typing.Dict[str, typing.Union[str, bool]],
        command: str,
        scanners: typing.List[str],
        domains: str,
        output: str) -> None:

    full_command = [
        command,
        domains,
        "--scan=%s" % ','.join(scanners),
        "--output=%s" % output,
        "--sort",
        "--meta",
    ]

    # Allow some options passed to python -m data.update to go
    # through to domain-scan.
    # Boolean flags.
    for flag in ["cache", "serial", "lambda"]:
        value = options.get(flag)
        if value:
            full_command += ["--%s" % flag]

    # Flags with values.
    for flag in ["lambda-profile"]:
        value = options.get(flag)
        if value:
            full_command += ["--%s=%s" % (flag, str(value))]

    # If Lambda mode is on, use way more workers.
    if options.get("lambda") and (options.get("serial", None) is None):
        full_command += ["--workers=%i" % env.LAMBDA_WORKERS]

    if options.get("debug"):
        LOGGER.info("Tracker running in debug mode...")
        full_command += ["2>&1 | tee debug_output.txt"]
        shell_out(full_command, debug=True)
    else:
        shell_out(full_command)


## Utils function for shelling out.
def shell_out(command, env=None, debug=False):
    try:
        LOGGER.info("[cmd] %s", str.join(" ", command))
        if debug:
            shell_cmd = str.join(" ", command)
            response = subprocess.check_output(shell_cmd, shell=True, env=env)
        else:
            response = subprocess.check_output(command, shell=False, env=env)
        output = str(response, encoding="UTF-8")
        LOGGER.info(output)
        return output
    except subprocess.CalledProcessError:
        LOGGER.critical("Error running %s.", str(command))
        exit(1)
        return None
