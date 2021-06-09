import subprocess

from sslyze import *  # TODO remove with demo code
from cryptography.hazmat.primitives.serialization import Encoding


def query_crlite(pem_cert: bytes) -> bool:
    """Checks if a PEM encoded certificate has been revoked with Mozilla's CRLite.

    Uses https://github.com/mozilla/moz_crlite_query and will raise an error if it is not installed.

    :param bytes pem_cert: A PEM encoded X.509 certificate.
    :return: True if cert is revoked, else False.
    :rtype: bool
    """
    # check input possibly
    # TODO remove pipenv run
    completed = subprocess.run(
        ["pipenv", "run", "moz_crlite_query", "-"],
        input=pem_cert.decode("ascii"),
        capture_output=True,
        text=True,
    )
    # mb raise error based on stderr?
    if "Revoked" in completed.stdout:
        return True
    else:
        return False


# TODO remove demo code
def main():
    server_location = ServerNetworkLocationViaDirectConnection.with_ip_address_lookup(
        "www.google.com", 443
    )

    server_info = ServerConnectivityTester().perform(server_location)

    scanner = Scanner()

    server_scan_req = ServerScanRequest(
        server_info=server_info,
        scan_commands={ScanCommand.CERTIFICATE_INFO},
    )

    scanner.start_scans([server_scan_req])

    for server_scan_result in scanner.get_results():
        certinfo_result = server_scan_result.scan_commands_results[
            ScanCommand.CERTIFICATE_INFO
        ]

        for cert_deployment in certinfo_result.certificate_deployments:
            print(
                cert_deployment.received_certificate_chain[0]
                .public_bytes(Encoding.PEM)
                .decode("ascii")
            )
            query_crlite(
                cert_deployment.received_certificate_chain[0].public_bytes(Encoding.PEM)
            )


if __name__ == "__main__":
    main()
