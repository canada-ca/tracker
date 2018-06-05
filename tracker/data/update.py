##
# This file must be run as a module in order for it to access
# modules in sibling directories.
#
# Run with:
#   python -m data.update

import subprocess
import datetime
import os
import ujson
import logging
import typing

# Import all the constants from data/env.py.
from data.env import *

# Import processing just for the function call.
import data.processing
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
# 3. Upload data to S3.
#    - Depends on the AWS CLI and access credentials already being configured.
#    - TODO: Consider moving from aws CLI to Python library.


# Options:
# scan_mode=[skip,here]
#     skip: skip all scanning, assume CSVs are locally cached
#     download: download scan data from S3
#     here: run the default full scan
# gather_mode=[skip,here]
#     skip: skip gathering, assume CSVs are locally cached
#     here: run the default full gather
# options
#     options to pass along to scan and gather operations

def update(scan_mode, gather_mode, options):
    if scan_mode == "here":
        # 1a. Gather .gov federal subdomains.
        if gather_mode == "here":
            LOGGER.info("Gathering subdomains.")
            gather_subdomains(options)
            LOGGER.info("Subdomain gathering complete.")
        elif gather_mode == "skip":
            LOGGER.info("Skipping subdomain gathering.")

        # One day, these variables pulled globally from env.py will be gone
        # And on that day, I will rejoice.
        domain_scanners = SCANNERS
        scan_command = SCAN_COMMAND
        subdomains = os.path.join(SUBDOMAIN_DATA_GATHERED, "results", "gathered.csv")
        subdomain_output = SUBDOMAIN_DATA_SCANNED
        parent_domains = DOMAINS
        parent_output = PARENTS_DATA

        # 1b. Scan subdomains for some types of things.
        LOGGER.info("Scanning subdomains.")
        scan_domains(options, scan_command, domain_scanners, subdomains, subdomain_output)
        LOGGER.info("Subdomain scanning complete")

        # 1c. Scan parent domains for all types of things.
        LOGGER.info("Scanning parent domains.")
        scan_domains(options, scan_command, domain_scanners, parent_domains, parent_output)
        LOGGER.info("Scan of parent domains complete.")


# Use domain-scan to gather .gov domains from public sources.
def gather_subdomains(options):
    LOGGER.info("[gather] Gathering subdomains.")

    full_command = [GATHER_COMMAND]

    full_command += [",".join(GATHERER_NAMES)]
    full_command += GATHERER_OPTIONS

    # Common to all gatherers.
    # --parents gets auto-included as its own gatherer source.
    full_command += [
        "--output=%s" % SUBDOMAIN_DATA_GATHERED,
        "--suffix=%s" % GATHER_SUFFIXES,
        "--parents=%s" % DOMAINS,
        "--ignore-www",
        "--sort",
        "--debug",  # always capture full output
    ]

    # Allow some options passed to python -m data.update to go
    # through to domain-scan.
    for flag in ["cache"]:
        if options.get(flag):
            full_command += ["--%s" % flag]

    shell_out(full_command)


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
        # "--debug", # always capture full output
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
        full_command += ["--workers=%i" % LAMBDA_WORKERS]

    shell_out(full_command)


## Utils function for shelling out.
def shell_out(command, env=None):
    try:
        LOGGER.info("[cmd] %s", str.join(" ", command))
        response = subprocess.check_output(command, shell=False, env=env)
        output = str(response, encoding="UTF-8")
        LOGGER.info(output)
        return output
    except subprocess.CalledProcessError:
        LOGGER.critical("Error running %s.", str(command))
        exit(1)
        return None
