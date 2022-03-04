import argparse
import json
import logging
import sys
from dataclasses import asdict

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description='Scan a domain HTTPS configuration.')
    parser.add_argument('domain', type=str,
                        help='the domain to scan')
    parser.add_argument('--ip', type=str,
                        help='the IP address to scan')
    parser.add_argument('-v', action='store_true',
                        help='enable verbose logging')

    args = parser.parse_args()

    from https_scanner import scan_http

    if args.v:
        logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)
    else:
        logging.basicConfig(stream=sys.stdout, level=logging.WARNING)

    scan_http(domain=args.domain, ip_address=args.ip)
    # print(json.dumps(scan_http(domain=args.domain, ip_address=args.ip).dict(), indent=4))
