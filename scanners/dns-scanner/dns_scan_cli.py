import argparse
import json
import logging
import sys


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description='Scan a domain for DNS records.')
    parser.add_argument('domain', type=str,
                        help='the domain to scan')
    parser.add_argument('--selectors', type=lambda selectors: [selector for selector in selectors.split(',') if selector],
                        help='a comma-seperated list of DKIM selectors')
    parser.add_argument('-v', action='count',
                        help='enable verbose logging', default=0)

    args = parser.parse_args()

    from dotenv import load_dotenv
    load_dotenv()

    from dns_scanner.dns_scanner import scan_domain

    log_levels = ["WARNING", "INFO", "DEBUG"]
    log_level = log_levels[min(args.v, len(log_levels) - 1)]

    logging.basicConfig(stream=sys.stderr, level=getattr(logging, log_level))

    res = scan_domain(domain=args.domain, dkim_selectors=args.selectors)
    print(json.dumps(res, indent=4))
