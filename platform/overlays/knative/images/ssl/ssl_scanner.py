import os
import sys
import requests
import logging
import json
import threading
import jwt
from sslyze.ssl_settings import TlsWrappedProtocolEnum
from sslyze.server_connectivity_tester import ServerConnectivityError, ServerConnectivityTester
from sslyze.plugins.openssl_cipher_suites_plugin import Tlsv12ScanCommand, Tlsv10ScanCommand, \
    Tlsv11ScanCommand, Tlsv13ScanCommand, Sslv20ScanCommand, Sslv30ScanCommand
from sslyze.plugins.certificate_info_plugin import CertificateInfoScanCommand
from sslyze.plugins.heartbleed_plugin import HeartbleedScanCommand
from sslyze.plugins.openssl_ccs_injection_plugin import OpenSslCcsInjectionScanCommand
from sslyze.concurrent_scanner import ConcurrentScanner
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
            request.get_data(),
            "test_jwt",
            algorithm=['HS256']
        )

        scan_id = decoded_payload["scan_id"]
        domain = decoded_payload["domain"]
        res = scan(scan_id, domain)
        if res is not None:
            payload = {"results": str(res), "scan_type": "ssl", "scan_id": scan_id}
        else:
            raise Exception("(SCAN: %s) - An error occurred while attempting to establish SSL connection" % scan_id)

        # TODO Replace secret
        encoded_payload = jwt.encode(
            payload,
            "test_jwt",
            algorithm='HS256'
        ).decode('utf-8')

        th = threading.Thread(target=dispatch, args=[encoded_payload, scan_id])
        th.start()

        return 'Scan sent to result-handling service'

    except Exception as e:
        logging.error(str(e)+'\n')
        return 'Failed to send scan to result-handling service'


def dispatch(payload, id):
    try:
        response = requests.post('http://34.67.57.19/receive', headers=headers, data=payload)
        logging.info("Scan %s completed. Results queued for processing...\n" % id)
        logging.info(str(response.text))
        return str(response.text)
    except Exception as e:
        logging.error("(SCAN: %s) - Error occurred while sending scan results: %s\n" % (id, e))


def get_server_info(scan_id, domain):

    try:
        server_tester = ServerConnectivityTester(hostname=domain)

        logging.info("\n(SCAN: %s) - Testing connectivity with %s:%s..." % (scan_id, server_tester.hostname, server_tester.port))
        server_info = server_tester.perform()
        logging.info("(SCAN: %s) - Server Info %s\n" % (scan_id, server_info))

        # TLS connection succeeded. Try establishing upgraded TLS connection on port 25 (SMTP)
        #if get_server_info_starttls(scan_id, domain, TlsWrappedProtocolEnum.STARTTLS_SMTP) is not None:
        #    return server_info, True

        return server_info, False

    except ServerConnectivityError as e:

        server_info = None
        # Could not establish a TLS connection to the server
        logging.error("(SCAN: %s) - Could not establish TLS connection to %s: %s.... Attempting to establish StartTLS connection" % (scan_id, e.server_info.hostname, e.error_message))

        # TLS connection failed... try to upgrade connection using StartTLS
        for _port in ServerConnectivityTester.TLS_DEFAULT_PORTS:
            if server_info is None:
                server_info = get_server_info_starttls(scan_id, domain, _port)

        if server_info is not None:
            return server_info, True
        else:
            # Could not establish a StartTLS connection to the server
            logging.error("(SCAN: %s) - Could not establish secure connection to %s using StartTLS: %s" % (
            scan_id, e.server_info.hostname, e.error_message))
            return None, False


def get_server_info_starttls(scan_id, domain, port):
    try:
        server_tester = ServerConnectivityTester(hostname=domain, port=port)
        logging.info("\n(SCAN: %s) - Testing connectivity with %s:%s..." % (
            scan_id, server_tester.hostname, server_tester.port))
        server_info = server_tester.perform()
        logging.info("(SCAN: %s) - Server Info %s\n" % (scan_id, server_info))
        return server_info

    except ServerConnectivityError as e:
        return None


def scan(scan_id, domain):

    server_info, starttls = get_server_info(scan_id, domain)

    if not server_info:
        return None
    else:
        tls_supported = str(server_info.highest_ssl_version_supported).split('.')[1]

    concurrent_scanner = ConcurrentScanner()

    concurrent_scanner.queue_scan_command(server_info, OpenSslCcsInjectionScanCommand())
    concurrent_scanner.queue_scan_command(server_info, HeartbleedScanCommand())
    concurrent_scanner.queue_scan_command(server_info, CertificateInfoScanCommand())

    if tls_supported == 'SSLV2':
        concurrent_scanner.queue_scan_command(server_info, Sslv20ScanCommand())
    elif tls_supported == 'SSLV3':
        concurrent_scanner.queue_scan_command(server_info, Sslv30ScanCommand())
    elif tls_supported == 'TLSV1':
        concurrent_scanner.queue_scan_command(server_info, Tlsv10ScanCommand())
    elif tls_supported == 'TLSV1_1':
        concurrent_scanner.queue_scan_command(server_info, Tlsv11ScanCommand())
    elif tls_supported == 'TLSV1_2':
        concurrent_scanner.queue_scan_command(server_info, Tlsv12ScanCommand())
    elif tls_supported == 'TLSV1_3':
        concurrent_scanner.queue_scan_command(server_info, Tlsv13ScanCommand())

    scan_results = concurrent_scanner.get_results()

    res = {"starttls": starttls, tls_supported: {}}
    for result in scan_results:
        if result.__class__.__name__ is "CipherSuiteScanResult":

            res[tls_supported] = {"accepted_cipher_list": [],
                                  "errored_cipher_list": [],
                                  "preferred_cipher": None,
                                  "rejected_cipher_list": []}

            res[tls_supported]["accepted_cipher_list"] = [c.name for c in result.accepted_cipher_list]
            res[tls_supported]["errored_cipher_list"] = [c.name for c in result.errored_cipher_list]
            res[tls_supported]["rejected_cipher_list"] = [c.name for c in result.rejected_cipher_list]
            res[tls_supported]["preferred_cipher"] = result.preferred_cipher.name

        elif result.__class__.__name__ is "OpenSslCcsInjectionScanResult":
            res["is_vulnerable_to_ccs_injection"] = result.is_vulnerable_to_ccs_injection

        elif result.__class__.__name__ is "HeartbleedScanResult":
            res["is_vulnerable_to_heartbleed"] = result.is_vulnerable_to_heartbleed

        elif result.__class__.__name__ is "CertificateInfoScanResult":
            res["signature_algorithm"] = result.verified_certificate_chain[0].signature_hash_algorithm.__class__.__name__

    rc4 = False
    triple_des = False
    for cipher in res[tls_supported]["accepted_cipher_list"]:
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

