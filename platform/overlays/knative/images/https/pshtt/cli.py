#!/usr/bin/env python

"""pshtt ("pushed") is a tool to test domains for HTTPS best practices.
Usage:
  pshtt (INPUT ...) [--output OUTFILE] [--sorted] [--json] [--markdown] [--debug] [--timeout TIMEOUT] [--user-agent AGENT] [--cache-third-parties DIR] [--ca-file PATH] [--pt-int-ca-file PATH]
  pshtt (-h | --help)
Options:
  -h --help                     Show this message.
  -s --sorted                   Sort output by domain, A-Z.
  -o --output=OUTFILE           Name output file. (Defaults to "results".)
  -j --json                     Get results in JSON. (Defaults to CSV.)
  -m --markdown                 Get results in Markdown. (Defaults to CSV.)
  -d --debug                    Print debug output.
  -u --user-agent=AGENT         Override user agent.
  -t --timeout=TIMEOUT          Override timeout (in seconds).
  -c --cache-third-parties=DIR  Cache third party data, and what directory to cache it in.
  -f --ca-file=PATH             Specify custom CA bundle (PEM format)
  -p --pt-int-ca-file=PATH       Specify public trust CA bundle with intermediates (PEM format)
Notes:
  If the first INPUT ends with .csv, domains will be read from CSV.
  CSV output will always be written to disk, defaulting to results.csv.
"""

import re
from . import pshtt
from . import utils


def to_json_dict(results):
    # Generate (yield) all the results before exporting to JSON
    results = list(results)
    for line in results:
        line = re.sub('[\n ]', '', line)
    json_content = utils.json_for(results)

    return json_content


def run(domains, debug=False, sorted=False):

    if debug:
        utils.configure_logging(debug)

    domains = utils.format_domains(domains)

    # If the user wants to sort them, sort them in place.
    if sorted:
        domains.sort()

    #options = {
    #    'user_agent': args['--user-agent'],
    #    'timeout': args['--timeout'],
    #    'cache-third-parties': args['--cache-third-parties'],
    #    'ca_file': args['--ca-file'],
    #    'pt_int_ca_file': args['--pt-int-ca-file']
    #}

    options = {
    'user_agent': None,
    'timeout': None,
    'cache-third-parties': None,
    'ca_file': None,
    'pt_int_ca_file': None
    }

    # Do the domain inspections
    results = pshtt.inspect_domains(domains, options)

    res_dict = to_json_dict(results)

    return res_dict
