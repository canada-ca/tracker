import argparse
import json
import logging
import sys

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

    scan_data = scan_http(domain=args.domain, ip_address=args.ip).dict()
    scan_data["sslyze_scan_result"]["scan_result"] = {
        "certificate_info": scan_data.get("sslyze_scan_result", {}).get("scan_result", {}).get("certificate_info", {})
    }

    print(json.dumps(scan_data, indent=4))
