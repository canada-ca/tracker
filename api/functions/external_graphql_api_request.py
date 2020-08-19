import json
import os

from gql import Client
from gql.transport.requests import RequestsHTTPTransport
from graphql import GraphQLError

from app import logger


def create_transport(api_domain, auth_token) -> RequestsHTTPTransport:
    """
    This function creates the transport object to send requests to an external
    API
    :param api_domain: The domain on which the external api is running on
    :param auth_token: Authorization token for privileged access on external
    api
    :return: This function returns a newly created RequestsHTTPTransport object
    """

    transport = RequestsHTTPTransport(
        url=api_domain, verify=True, retries=3, headers={"Authorization": auth_token},
    )
    return transport


def create_client(api_domain, auth_token) -> Client:
    """
    This function is used to create the client that will execute the query
    :param api_domain: External API URL used to create the transport object
    :param auth_token: Authorization token used in the creation of the transport object
    :return: A gql Client that allows the execution of queries on an graphql API
    """
    client = Client(
        transport=create_transport(api_domain=api_domain, auth_token=auth_token),
        fetch_schema_from_transport=True,
    )
    return client


def send_request(
    variables: dict,
    query,
    summary_table=False,
    api_domain=os.getenv("DMARC_REPORT_API_URL"),
    auth_token=os.getenv("DMARC_REPORT_API_TOKEN"),
) -> dict:
    """
    This function sends the request to the external API, with a pre-determined
    query
    :param api_domain: The domain on which the external API is running on
    :param auth_token: Authorization token allowing privileged access to the
    external API
    :param request_domain: The domain slug that the user is requesting
    information about
    :param start_date: Pre-determined value of january 1st of last year
    :param end_date: Pre-determined value of december 31st of next year
    :return: Dictionary of data retrieved from external API
    """
    try:
        client = create_client(api_domain=api_domain, auth_token=auth_token)

        data = client.execute(query, variables)

        return data

    except Exception as e:
        logger.error(f"Error occurred on the dmarc-report-api side: {str(e)}")
        if summary_table:
            return {}
        else:
            raise GraphQLError("Error when querying dmarc-report-api.")
