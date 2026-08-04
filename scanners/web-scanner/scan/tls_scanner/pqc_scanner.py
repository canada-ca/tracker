# Experimental post-quantum TLS check.
#
# scan_pqc() reruns this file with /opt/experimental, using a separate python environment with dev versions of nassl and sslyze.
# sslyze is imported inside run_pqc_scan() so prod and experimental builds are never loaded together.


import argparse
import json
import logging
import os
import subprocess
import sys
import time
from pathlib import Path

logger = logging.getLogger(__name__)

EXPERIMENTAL_PYTHON = os.getenv("EXPERIMENTAL_PYTHON", "/opt/experimental/bin/python")

PQC_SCAN_TIMEOUT = float(os.getenv("PQC_SCAN_TIMEOUT", 10))

# Build references for the dev versions of nassl and sslyze
BUILD_REFS_PATH = Path(sys.prefix) / "build_refs.json"

CONNECT_TIMEOUT = 2

PER_SERVER_CONCURRENT_CONNECTIONS_LIMIT = int(
    os.getenv("PER_SERVER_CONCURRENT_CONNECTIONS_LIMIT", 2)
)


def scan_pqc(domain: str, ip_address: str) -> dict:
    command = [EXPERIMENTAL_PYTHON, __file__, domain]
    if ip_address:
        command += ["--ip", str(ip_address)]

    # Pass through the environment minus PYTHONPATH, since the subprocess runs in the
    # experimental environment and an inherited PYTHONPATH could shadow its sslyze with the
    # prod copy
    env = {k: v for k, v in os.environ.items() if k != "PYTHONPATH"}

    # Run everything in a try block to ensure this experimental scanner doesn't cause the main scanner to error
    try:
        completed = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=PQC_SCAN_TIMEOUT,
            env=env,
        )

        if not completed.stdout.strip():
            logger.error(
                f"PQC scan returned no output for domain '{domain}' at IP '{ip_address}' "
                f"(exit code {completed.returncode}): {completed.stderr.strip()}"
            )
            return {"error": f"PQC scan returned no output (exit code {completed.returncode})"}

        result = json.loads(completed.stdout)

        if not isinstance(result, dict):
            logger.error(
                f"PQC scan output for domain '{domain}' at IP '{ip_address}' is not an object"
            )
            return {"error": "PQC scan output is not a JSON object"}

        if completed.returncode != 0:
            logger.error(
                f"PQC scan exited with code {completed.returncode} for domain '{domain}' at IP "
                f"'{ip_address}': {completed.stderr.strip()}"
            )
            result.setdefault("error", f"PQC scan exited with code {completed.returncode}")

        return result

    except subprocess.TimeoutExpired:
        logger.info(
            f"PQC scan timed out after {PQC_SCAN_TIMEOUT}s for domain '{domain}' at IP '{ip_address}'"
        )
        return {"error": f"PQC scan timed out after {PQC_SCAN_TIMEOUT}s"}
    except FileNotFoundError:
        logger.error(
            f"Experimental interpreter not found at '{EXPERIMENTAL_PYTHON}' for domain '{domain}'"
        )
        return {"error": f"Experimental interpreter not found at {EXPERIMENTAL_PYTHON}"}
    except json.JSONDecodeError as e:
        logger.error(
            f"Could not parse PQC scan output for domain '{domain}' at IP '{ip_address}': {str(e)}"
        )
        return {"error": f"Could not parse PQC scan output: {str(e)}"}
    except Exception as e:
        logger.error(
            f"Unknown error running PQC scan for domain '{domain}' at IP '{ip_address}': {str(e)}"
        )
        return {"error": f"Unknown error running PQC scan: {str(e)}"}


def get_version_commit_refs() -> dict:
    try:
        return json.loads(BUILD_REFS_PATH.read_text())
    except Exception as e:
        logger.error(f"Could not read commit refs at '{BUILD_REFS_PATH}': {e}")
        return {}


def run_pqc_scan(domain: str, ip_address: str) -> dict:
    from sslyze import (
        Scanner,
        ServerNetworkConfiguration,
        ServerNetworkLocation,
        ServerScanRequest,
    )
    from sslyze.plugins.scan_commands import ScanCommand

    scanner = Scanner(
        per_server_concurrent_connections_limit=PER_SERVER_CONCURRENT_CONNECTIONS_LIMIT
    )
    scanner.queue_scans(
        [
            ServerScanRequest(
                server_location=ServerNetworkLocation(
                    hostname=domain,
                    ip_address=ip_address,
                ),
                scan_commands={ScanCommand.PQ_KEY_EXCHANGE},
                network_configuration=ServerNetworkConfiguration(
                    tls_server_name_indication=domain, network_timeout=CONNECT_TIMEOUT
                ),
            )
        ]
    )
    scan_results = [x for x in scanner.get_results()][0]

    result = {
        "domain": domain,
        "ip_address": ip_address,
        "scan_status": scan_results.scan_status,
        "status": None,
        "supports_pq_key_exchange": None,
        "supported_pq_groups": None,
        "tls_1_3_supported": None,
        "error": None,
        "error_reason": None,
    }

    if not scan_results.scan_result:
        logger.info(
            f"No PQC scan result for domain '{domain}' at IP '{ip_address}': {scan_results.scan_status}"
        )
        result["error"] = f"sslyze returned no scan result ({scan_results.scan_status})"
        return result

    attempt = scan_results.scan_result.pq_key_exchange
    result["status"] = attempt.status
    result["error_reason"] = attempt.error_reason
    if attempt.error_trace:
        result["error"] = "".join(attempt.error_trace.format()).strip()

    if attempt.result:
        # supported_pq_groups is None only when the server has no TLS 1.3, so nothing was tested
        result["supported_pq_groups"] = attempt.result.supported_pq_groups
        result["supports_pq_key_exchange"] = attempt.result.supports_pq_key_exchange
        result["tls_1_3_supported"] = attempt.result.supported_pq_groups is not None

    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description='Probe a server for post-quantum TLS 1.3 key exchange support.')
    parser.add_argument('domain', type=str,
                        help='the domain to scan')
    parser.add_argument('--ip', type=str,
                        help='the IP address to scan')
    parser.add_argument('-v', action='store_true',
                        help='enable verbose logging')

    args = parser.parse_args()

    logging.basicConfig(stream=sys.stderr,
                        level=logging.DEBUG if args.v else logging.WARNING,
                        format='[%(asctime)s::%(name)s::%(levelname)s] :: %(message)s')

    started_at = time.monotonic()
    exit_code = 0

    try:
        scan_data = run_pqc_scan(domain=args.domain, ip_address=args.ip)
    except Exception as error:
        logger.error(
            f"Unexpected error during PQC scan for domain '{args.domain}' at IP '{args.ip}': {str(error)}"
        )
        scan_data = {
            "domain": args.domain,
            "ip_address": args.ip,
            "error": f"Unexpected error during PQC scan: {str(error)}",
        }
        exit_code = 1

    scan_data["duration_seconds"] = round(time.monotonic() - started_at, 3)
    scan_data["build_refs"] = get_version_commit_refs()

    # stdout carries the result, stderr carries the logging
    json.dump(scan_data, sys.stdout)
    sys.exit(exit_code)
