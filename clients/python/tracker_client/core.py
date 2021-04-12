"""This module provides utility functions related to gql, for internal use."""
import os
import re

from gql import Client
from gql.transport.aiohttp import AIOHTTPTransport

from queries import SIGNIN_MUTATION, TFA_AUTH
from __version__ import __version__


_JWT_RE = r"^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$"
"""Regex to validate a JWT"""


def generate_headers(auth_token, language):
    """Returns HTTP header dict with "authorization", "accept-language", and "user-agent" set.

    :param str auth_token: JWT auth token.
    :param str language: value to set the http "accept-language" header to.
    :return: a dict with the HTTP headers the client will use.
    :rtype: dict
    """
    return {
        "authorization": auth_token,
        "accept-language": language.lower(),
        "user-agent": f"TRACKER-API-PYTHON-CLIENT/{__version__}",
    }


def _create_transport(url, auth_token, language):
    """Create and return a gql transport object.

    :param str url: the Tracker GraphQL endpoint url.
    :param str auth_token: JWT auth token, omit when initially obtaining the token (default is none).
    :param str lang: value to set the http "accept-language" header to.
    :return: A gql transport for given url.
    :rtype: AIOHTTPTransport
    :raises ValueError: if auth_token is not a valid JWT or language is not "en" or "fr".
    :raises TypeError: if auth_token is not a string.
    """
    if auth_token is None:
        transport = AIOHTTPTransport(url=url)

    else:
        # Resulting stack trace is very unhelpful when passing an invalid token
        # We validate the given auth_token and raise an exception if it's invalid
        # to make debugging easier
        if not isinstance(auth_token, str):
            raise TypeError("auth_token must be a string")

        if not re.match(_JWT_RE, auth_token):
            raise ValueError("auth_token is not a valid JWT")

        if language.lower() != "en" and language.lower() != "fr":
            raise ValueError("Language must be 'en' or 'fr'")

        transport = AIOHTTPTransport(
            url=url,
            headers=generate_headers(auth_token, language),
        )

    return transport


def create_client(
    url="https://tracker.alpha.canada.ca/graphql", auth_token=None, language="en"
):
    """Create and return a gql client object

    :param str url: the Tracker GraphQL endpoint url.
    :param str auth_token: JWT auth token, omit when initially obtaining the token (default is None).
    :param str lang: desired language to get data from Tracker in ('en' or 'fr').
    :return: A gql client with AIOHTTPTransport.
    :rtype: Client
    """
    client = Client(
        transport=_create_transport(url, auth_token, language),
        fetch_schema_from_transport=True,
    )
    return client


def get_auth_token(url="https://tracker.alpha.canada.ca/graphql"):
    """Get a token to use for authentication.

    Takes in environment variables "TRACKER_UNAME" and "TRACKER_PASS" to get credentials.

    :param str url: the Tracker GraphQL endpoint url.
    :return: JWT auth token to allow access to Tracker.
    :rtype: str
    :raises ValueError: if credentials aren't found in environment.
    :raises RuntimeError: if the server replies with an error.
    """
    client = create_client(url)

    username = os.environ.get("TRACKER_UNAME")
    password = os.environ.get("TRACKER_PASS")

    if username is None or password is None:
        raise ValueError("Tracker credentials missing from environment.")

    params = {"creds": {"userName": username, "password": password}}
    result = client.execute(SIGNIN_MUTATION, variable_values=params)

    # Only true on SignInError
    if "code" in result["signIn"]["result"]:
        print("Unable to sign in to Tracker.")
        raise RuntimeError(result["signIn"]["result"])

    # Only true on TFASignInResult
    if "sendMethod" in result["signIn"]["result"]:
        send_method = result["signIn"]["result"]["sendMethod"]
        tfa_token = result["signIn"]["result"]["authenticateToken"]
        return _tfa_get_auth_token(send_method, tfa_token, client)

    auth_token = result["signIn"]["result"]["authToken"]
    return auth_token


def _tfa_get_auth_token(send_method, token, client):
    """Get a token from a TFA enabled account to use for authentication .

    :param str send_method: how the TFA code was sent ("phone" or "email").
    :param str token: JWT from sign in mutation.
    :param Client client: gql client instance.
    :return: JWT auth token to allow access to Tracker.
    :rtype: str
    :raises RuntimeError: if the server replies with an error.
    """
    if send_method == "email":
        auth_code = int(
            input("Please enter the authentication code sent to you by email: ")
        )
    if send_method == "phone":
        auth_code = int(
            input("Please enter the authentication code sent to you by SMS: ")
        )

    params = {
        "authInput": {"authenticationCode": auth_code, "authenticateToken": token}
    }
    result = client.execute(TFA_AUTH, variable_values=params)

    # Only true on AuthenticateError
    if "code" in result["authenticate"]["result"]:
        print("Unable to authenticate.")
        raise RuntimeError(result["authenticate"]["result"])

    auth_token = result["authenticate"]["result"]["authToken"]
    return auth_token
