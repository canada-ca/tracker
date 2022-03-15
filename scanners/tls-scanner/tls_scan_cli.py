import argparse
import json
import logging
import sys

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description='Scan a domain TLS configuration.')
    parser.add_argument('domain', type=str,
                        help='the domain to scan')
    parser.add_argument('--ip', type=str,
                        help='the IP address to scan')
    parser.add_argument('-v', action='store_true',
                        help='enable verbose logging')

    args = parser.parse_args()

    from tls_scanner import TLSScanner

    if args.v:
        logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)
    else:
        logging.basicConfig(stream=sys.stdout, level=logging.WARNING)

    scanner = TLSScanner(domain=args.domain, ip_address=args.ip)
    print(json.dumps(scanner.run(), indent=4))
