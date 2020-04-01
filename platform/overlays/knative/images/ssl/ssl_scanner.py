import os
import sys
import requests
import logging
import json
import threading
import jwt
from sslyze.server_connectivity import ServerConnectivityTester
from sslyze.errors import ConnectionToServerFailed
from sslyze.plugins.scan_commands import ScanCommand
from sslyze.plugins.openssl_cipher_suites.implementation import \
    Tlsv12ScanImplementation, Tlsv10ScanImplementation, \
    Tlsv11ScanImplementation, Tlsv13ScanImplementation, \
    Sslv20ScanImplementation, Sslv30ScanImplementation
from sslyze.plugins.certificate_info.implementation import CertificateInfoImplementation
from sslyze.plugins.heartbleed_plugin import HeartbleedImplementation
from sslyze.plugins.openssl_ccs_injection_plugin import OpenSslCcsInjectionImplementation
from sslyze.scanner import Scanner, ServerScanRequest
from sslyze.server_setting import ServerNetworkLocation, ServerNetworkLocationViaDirectConnection
from flask import Flask, request

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

headers = {
    'Content-Type': 'application/json',
    'Host': 'result-processor.tracker.example.com'
}

app = Flask(__name__)


@app.route('/receive', methods=['GET', 'POST'])
def receive():

    logging.info("Event received\n")

    try:
        # TODO Replace secret
        decoded_payload = jwt.decode(
            request.headers.get("Data"),
            "test_jwt",
            algorithm=['HS256']
        )

        test_flag = request.headers.get("Test")
        scan_id = decoded_payload["scan_id"]
        domain = decoded_payload["domain"]

        # Perform scan
        res = scan(scan_id, domain)

        # If this was a test scan, return results
        if test_flag:
            return str(res)

        # Construct request payload for result-processor
        if res is not None:
            payload = {"results": str(res)}
            token = {"scan_type": "ssl", "scan_id": scan_id}
            logging.info(str(res) + '\n')
        else:
            raise Exception("(SCAN: %s) - An error occurred while attempting to establish SSL connection" % scan_id)

        # TODO Replace secret
        headers["Token"] = jwt.encode(
            token,
            "test_jwt",
            algorithm='HS256'
        ).decode('utf-8')

        # Dispatch results to result-processor asynchronously
        th = threading.Thread(target=dispatch, args=[scan_id, payload])
        th.start()

        return 'Scan sent to result-handling service'

    except Exception as e:
        logging.error(str(e)+'\n')
        return 'Failed to send scan to result-handling service'


def dispatch(scan_id, payload):
    try:
        # Post request to result-handling service
        # TODO: Pull values from env
        response = requests.post('http://34.67.57.19/receive', headers=headers, data=payload)
        logging.info("Scan %s completed. Results queued for processing...\n" % scan_id)
        logging.info(str(response.text))
        return str(response.text)
    except Exception as e:
        logging.error("(SCAN: %s) - Error occurred while sending scan results: %s\n" % (scan_id, e))


def get_server_info(scan_id, domain):

    try:
        # Retrieve server information, look-up IP address
        server_location = ServerNetworkLocationViaDirectConnection.with_ip_address_lookup(domain, 443)
        server_tester = ServerConnectivityTester()

        logging.info("\n(SCAN: %s) - Testing connectivity with %s:%s..." % (scan_id, server_location.hostname, server_location.port))
        # Test connection to server and retrieve info
        server_info = server_tester.perform(server_location)
        logging.info("(SCAN: %s) - Server Info %s\n" % (scan_id, server_info))

        return server_info

    except ConnectionToServerFailed as e:

        server_info = None
        # Could not establish a TLS connection to the server
        return server_info


def scan(scan_id, domain):

    server_info = get_server_info(scan_id, domain)

    if server_info is None:
        return None
    else:
        # Retrieve highest TLS supported from retrieved server info
        tls_supported = str(server_info.tls_probing_result.highest_tls_version_supported).split('.')[1]

    scanner = Scanner()

    designated_scans = set()

    # Scan for common vulnerabilities and certificate info
    designated_scans.add(ScanCommand.OPENSSL_CCS_INJECTION)
    designated_scans.add(ScanCommand.HEARTBLEED)
    designated_scans.add(ScanCommand.CERTIFICATE_INFO)

    # Test supported SSL/TLS
    if tls_supported == 'SSL_2_0':
        designated_scans.add(ScanCommand.SSL_2_0_CIPHER_SUITES)
    elif tls_supported == 'SSL_3_0':
        designated_scans.add(ScanCommand.SSL_3_0_CIPHER_SUITES)
    elif tls_supported == 'TLS_1_0':
        designated_scans.add(ScanCommand.TLS_1_0_CIPHER_SUITES)
    elif tls_supported == 'TLS_1_1':
        designated_scans.add(ScanCommand.TLS_1_1_CIPHER_SUITES)
    elif tls_supported == 'TLS_1_2':
        designated_scans.add(ScanCommand.TLS_1_2_CIPHER_SUITES)
    elif tls_supported == 'TLS_1_3':
        designated_scans.add(ScanCommand.TLS_1_3_CIPHER_SUITES)

    scan_request = ServerScanRequest(server_info=server_info, scan_commands=designated_scans)

    scanner.queue_scan(scan_request)

    # Wait for asynnchronous scans to complete
    scan_results = scanner.get_results()

    res = {"TLS": {}}

    # Parse scan results for required info
    for result in scan_results:
        if result.__class__.__name__ is "CipherSuiteScanResult":

            res["TLS"] = {"supported": tls_supported,
                          "accepted_cipher_list": [],
                          "errored_cipher_list": [],
                          "preferred_cipher": None,
                          "rejected_cipher_list": []}

            res["TLS"]["accepted_cipher_list"] = [c.name for c in result.accepted_cipher_list]
            res["TLS"]["errored_cipher_list"] = [c.name for c in result.errored_cipher_list]
            res["TLS"]["rejected_cipher_list"] = [c.name for c in result.rejected_cipher_list]
            res["TLS"]["preferred_cipher"] = result.preferred_cipher.name

        elif result.__class__.__name__ is "OpenSslCcsInjectionScanResult":
            res["is_vulnerable_to_ccs_injection"] = result.is_vulnerable_to_ccs_injection

        elif result.__class__.__name__ is "HeartbleedScanResult":
            res["is_vulnerable_to_heartbleed"] = result.is_vulnerable_to_heartbleed

        elif result.__class__.__name__ is "CertificateInfoScanResult":
            res["signature_algorithm"] = result.verified_certificate_chain[0].signature_hash_algorithm.__class__.__name__

    rc4 = False
    triple_des = False

    # Check for RC4/3DES ciphers
    for cipher in res["TLS"]["accepted_cipher_list"]:
        if "RC4" in cipher:
            rc4 = True
        if "3DES" in cipher:
            triple_des = True

    res["rc4"] = rc4
    res["3des"] = triple_des

    return res


if __name__ == "__main__":
    # Port number defaults to 8080, can be configured as an ENV
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))

