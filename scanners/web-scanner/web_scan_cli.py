import argparse
import json
import logging
import sys

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description='Scan a domain web configuration.')
    parser.add_argument('domain', type=str,
                        help='the domain to scan')
    parser.add_argument('--ip', type=str,
                        help='the IP address to scan')
    parser.add_argument('-v', action='store_true',
                        help='enable verbose logging')

    args = parser.parse_args()

    from web_scanner import scan_web

    if args.v:
        logging.basicConfig(level=logging.DEBUG)
    else:
        logging.basicConfig(level=logging.WARNING)

    scan_data = scan_web(domain=args.domain, ip_address=args.ip)

    print(json.dumps(scan_data, indent=4))
