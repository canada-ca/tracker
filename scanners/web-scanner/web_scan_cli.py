import argparse
import json
import logging

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description='Scan a domain web configuration.')
    parser.add_argument('domain', type=str,
                        help='the domain to scan')
    parser.add_argument('--ip', type=str,
                        help='the IP address to scan')
    parser.add_argument('--pqc', action='store_true',
                        help='force the experimental post-quantum key exchange check on, '
                             'regardless of PQC_SCAN_ENABLED')
    parser.add_argument('--pqc-only', action='store_true',
                        help='run only the experimental post-quantum key exchange check')
    parser.add_argument('-v', action='store_true',
                        help='enable verbose logging')

    args = parser.parse_args()

    if args.v:
        logging.basicConfig(level=logging.DEBUG, format='[%(asctime)s::%(name)s::%(levelname)s] :: %(message)s')
    else:
        logging.basicConfig(level=logging.WARNING, format='[%(asctime)s::%(name)s::%(levelname)s] :: %(message)s')

    if args.pqc_only:
        from scan.tls_scanner.pqc_scanner import scan_pqc

        scan_data = scan_pqc(domain=args.domain, ip_address=args.ip)
    else:
        from scan.web_scanner import scan_web

        scan_data = scan_web(domain=args.domain, ip_address=args.ip,
                             pqc_enabled=True if args.pqc else None)

    print(json.dumps(scan_data, indent=4))

