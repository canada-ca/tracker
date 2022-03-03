import sys
import logging
import json
from dataclasses import dataclass
from sslyze import Scanner, ServerScanRequest, ServerScanResultAsJson, ScanCommandResult, ServerScanResult
from sslyze.connection_helpers.http_request_generator import \
    HttpRequestGenerator
from sslyze.connection_helpers.http_response_parser import HttpResponseParser
from sslyze.plugins.scan_commands import ScanCommand
from sslyze.errors import ServerHostnameCouldNotBeResolved
from sslyze.server_connectivity import check_connectivity_to_server, \
    ServerConnectivityInfo
from sslyze.server_setting import (
    ServerNetworkLocation,
    ServerNetworkConfiguration,
)
# logging.basicConfig(stream=sys.stdout, level=logging.WARNING)
logger = logging.getLogger(__name__)
from scan import https


@dataclass
class HTTPConnection:
    live: bool
    redirect_to: str


@dataclass
class HTTPSConnection:
    ssl_connection: list[dict]


@dataclass
class HTTPResult(ScanCommandResult):
    uri: str
    ip: str
    live: bool
    connections: list[dict]
    protocol: str = "http"


@dataclass
class HTTPSResult(HTTPResult):
    protocol: str = "https"


@dataclass
class ScanHTTPChainResult:
    http_chain_result: HTTPResult
    https_chain_result: HTTPSResult


# class HTTPScanner:
#     domain = None
#
#     def __init__(self, target_domain):
#         self.domain = target_domain
#
#     def run(self) -> ScanResult:
#         try:
#             results = https.run([self.domain])
#             print({"full results": results})
#             return results.get(self.domain)
#         except Exception as e:
#             logger.error(f"An error occurred while scanning domain: {e}")
#             return {}


def run_sslyze_scan(server_location: ServerNetworkLocation, network_configuration: ServerNetworkConfiguration) -> ServerScanResult:
    try:
        all_scan_requests = [
            ServerScanRequest(server_location=server_location,
                              network_configuration=network_configuration,
                              scan_commands={ScanCommand.CERTIFICATE_INFO}),
        ]
    except ServerHostnameCouldNotBeResolved:
        # Handle bad input ie. invalid hostnames
        logger.error("Error resolving the supplied hostname")
        raise

    scanner = Scanner()
    scanner.queue_scans(all_scan_requests)

    return [result for result in scanner.get_results()][0]


def run_http_chain_scan(server_location: ServerNetworkLocation, network_configuration: ServerNetworkConfiguration):
    try:
        tls_probing_result = check_connectivity_to_server(
            server_location=server_location,
            network_configuration=network_configuration)
        server_connectivity_info = ServerConnectivityInfo(
            server_location=server_location,
            network_configuration=network_configuration,
            tls_probing_result=tls_probing_result)

        tls_connection = server_connectivity_info.get_preconfigured_tls_connection()
        tls_connection.connect()
    except BaseException:
        logger.error(f"Could not make connection to {server_location.hostname}.")
        raise

    try:
        tls_connection.ssl_client.write(
            HttpRequestGenerator.get_request(
                host=server_connectivity_info.network_configuration.tls_server_name_indication,
                path="/home.html"
            )
        )
    except BaseException:
        logger.error(f"Error while sending request to {server_location.hostname}")
        raise
    finally:
        tls_connection.close()

    try:
        http_response = HttpResponseParser.parse_from_ssl_connection(
            tls_connection.ssl_client)
    except BaseException as e:
        logger.error(f"Error while parsing response from {server_location.hostname}", exc_info=e)
        sys.exit()

    return http_response


def scan_http(domain, ip_address=None):
    logger.debug("TEST")

    server_location = ServerNetworkLocation(
        hostname=domain, ip_address=ip_address)
    network_configuration = ServerNetworkConfiguration.default_for_server_location(
        server_location)

    sslyze_results = run_sslyze_scan(server_location=server_location, network_configuration=network_configuration)
    sslyze_results_as_dict = json.loads(ServerScanResultAsJson.from_orm(
        sslyze_results).json())

    http_chain_results = run_http_chain_scan(server_location=server_location, network_configuration=network_configuration)

    print(http_chain_results.__dict__)

    # return sslyze_results_as_dict

    # try:
    #     tls_probing_result = check_connectivity_to_server(
    #         server_location=server_location,
    #         network_configuration=network_configuration)
    #     server_connectivity_info = ServerConnectivityInfo(
    #         server_location=server_location, network_configuration=network_configuration, tls_probing_result=tls_probing_result)
    #
    #     tls_connection = server_connectivity_info.get_preconfigured_tls_connection()
    #     tls_connection.connect()
    #
    # except BaseException as err:
    #     print("Could not make connection")
    #     print(err)
    #     pass
    #
    # try:
    #     tls_connection.ssl_client.write(
    #         HttpRequestGenerator.get_request(
    #             host=server_connectivity_info.network_configuration.tls_server_name_indication,
    #             path="/home.html"
    #         )
    #     )
    #     http_response = HttpResponseParser.parse_from_ssl_connection(
    #         tls_connection.ssl_client)
    #     # print(tls_connection.ssl_client.read())
    #
    # except BaseException as err:
    #     print(f"Error while scanning domain: {err}")
    #
    # finally:
    #     tls_connection.close()

    # print(http_response.__dict__)

    # print(http_response.read(9112))



    # results["http_scan_result"] = http_response

    # return SslyzeOutputAsJson(
    #     server_scan_results=[ServerScanResultAsJson.from_orm(result) for result
    #                          in scanner.get_results()],
    #     date_scans_started=start_time,
    #     date_scans_completed=datetime.utcnow())
    #
    # return results

