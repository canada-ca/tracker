import os
import sys
import requests
import logging
import json
from sslyze.ssl_settings import TlsWrappedProtocolEnum
from sslyze.server_connectivity_tester import ServerConnectivityError, ServerConnectivityTester
from sslyze.plugins.openssl_cipher_suites_plugin import Tlsv12ScanCommand, Tlsv10ScanCommand, \
    Tlsv11ScanCommand, Tlsv13ScanCommand, Sslv20ScanCommand, Sslv30ScanCommand
from sslyze.plugins.openssl_certificate_info_plugin import CertificateInfoScanCommand
from sslyze.concurrent_scanner import ConcurrentScanner
from flask import Flask, request

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

headers = {
    'Content-Type': 'application/json',
    'Host': 'result-processor.tracker.example.com',
}

app = Flask(__name__)


@app.route('/receive', methods=['GET', 'POST'])
def receive():

    logging.info("Event received\n")

    try:
        scan_id = request.json['scan_id']
        domain = request.json['domain']
        res = scan(scan_id, domain)
        if res is not None:
            payload = json.dumps({"results": str(res), "scan_type": "ssl", "scan_id": scan_id})
        else:
            raise Exception("(SCAN: %s) - An error occurred while attempting to establish SSL connection" % scan_id)

        dispatch(payload)

    except Exception as e:
        logging.error(str(e)+'\n')


def dispatch(payload):
    try:
        response = requests.post('http://34.67.57.19/dispatch', headers=headers, data=payload)
        logging.info("Scan %s completed. Results queued for processing...\n" % payload["scan_id"])
        logging.info(str(response.text))
        return str(response.text)
    except Exception as e:
        logging.error("(SCAN: %s) - Error occurred while sending scan results: %s\n" % (payload["scan_id"], e))


def scan(scan_id, domain):

    try:
        server_tester = ServerConnectivityTester(hostname=domain)

        logging.info("\n(SCAN: %s) - Testing connectivity with %s:%s..." % (scan_id, server_tester.hostname, server_tester.port))
        server_info = server_tester.perform()
        logging.info("(SCAN: %s) - Server Info %s\n" % (scan_id, server_info))
    except ServerConnectivityError as e:
        # Could not establish an SSL connection to the server
        logging.error("(SCAN: %s) - Could not connect to %s: %s" % (scan_id, e.server_info.hostname, e.error_message))
        return None

    command = Tlsv10ScanCommand()

    concurrent_scanner = ConcurrentScanner()

    concurrent_scanner.queue_scan_command(server_info, Sslv20ScanCommand())
    concurrent_scanner.queue_scan_command(server_info, Sslv30ScanCommand())
    concurrent_scanner.queue_scan_command(server_info, Tlsv10ScanCommand())
    concurrent_scanner.queue_scan_command(server_info, Tlsv11ScanCommand())
    concurrent_scanner.queue_scan_command(server_info, Tlsv12ScanCommand())
    concurrent_scanner.queue_scan_command(server_info, Tlsv13ScanCommand())
    concurrent_scanner.queue_scan_command(server_info, CertificateInfoScanCommand())

    scan_result = concurrent_scanner.run_scan_command(server_info, command)

    return scan_result


if __name__ == "__main__":
    # Port number defaults to 8080, can be configured as an ENV
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))

