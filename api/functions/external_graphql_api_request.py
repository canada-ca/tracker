import json

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
        url=api_domain, verify=False, retries=3, headers={"Authorization": auth_token}
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


def send_request(api_domain, auth_token, variables: dict, query) -> dict:
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
        # Make sure the below stays like so
        # error_str = e.__str__().replace("\'", '\"')
        # Black will try and change it and it will break !!!
        error_str = e.__str__().replace("'", '"')
        try:
            error_dict = json.loads(error_str)
            if error_dict.get("message", None):
                logger.error(
                    f"Error occurred on the dmarc-report-api side: {str(error_dict.get('message'))}"
                )
                raise GraphQLError("Error when querying dmarc-report-api.")

        except ValueError as ve:
            logger.error(
                f"Value Error occurred when receiving data from dmarc-report-api: {str(ve)}"
            )
            raise GraphQLError("Error, when querying dmarc-report-api.")
