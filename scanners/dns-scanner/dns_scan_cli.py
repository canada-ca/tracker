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
    parser.add_argument('-v', action='store_true',
                        help='enable verbose logging')

    args = parser.parse_args()

    from dns_scanner.dns_scanner import scan_domain

    if args.v:
        logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)
    else:
        logging.basicConfig(stream=sys.stdout, level=logging.WARNING)

    res = scan_domain(domain=args.domain, dkim_selectors=args.selectors)
    print(json.dumps(res, indent=4))
