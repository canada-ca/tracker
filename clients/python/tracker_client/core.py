"""This module provides utility functions related to gql, for internal use"""
import os
import re

from gql import Client
from gql.transport.aiohttp import AIOHTTPTransport

from queries import SIGNIN_MUTATION


_JWT_RE = r"^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$"
"""Regex to validate a JWT"""


def create_transport(url, auth_token=None):
    """Create and return a gql transport object

    Users should rarely, if ever, need to call this

    :param str url: the Tracker GraphQL endpoint url
    :param str auth_token: JWT auth token, omit when initially obtaining the token (default is none)
    :return: A gql transport for given url
    :rtype: AIOHTTPTransport
    :raises ValueError: if auth_token is not a valid JWT
    :raises TypeError: if auth_token is not a string
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

        transport = AIOHTTPTransport(
            url=url,
            headers={"authorization": auth_token},
        )

    return transport


def create_client(url="https://tracker.alpha.canada.ca/graphql", auth_token=None):
    """Create and return a gql client object

    :param str url: the Tracker GraphQL endpoint url (default is "https://tracker.alpha.canada.ca/graphql")
    :param str auth_token: JWT auth token, omit when initially obtaining the token (default is None)
    :return: A gql client with AIOHTTPTransport
    :rtype: Client
    """
    client = Client(
        transport=create_transport(url=url, auth_token=auth_token),
        fetch_schema_from_transport=True,
    )
    return client


def get_auth_token(url="https://tracker.alpha.canada.ca/graphql"):
    """Get a token to use for authentication.

    Takes in environment variables "TRACKER_UNAME" and "TRACKER_PASS" to get credentials

    :param str url: the Tracker GraphQL endpoint url (default is "https://tracker.alpha.canada.ca/graphql")
    :return: JWT auth token to allow access to Tracker
    :rtype: str
    """
    client = create_client(url)

    username = os.environ.get("TRACKER_UNAME")
    password = os.environ.get("TRACKER_PASS")

    if username is None or password is None:
        raise ValueError("Tracker credentials missing from environment.")

    params = {"creds": {"userName": username, "password": password}}

    result = client.execute(SIGNIN_MUTATION, variable_values=params)
    auth_token = result["signIn"]["result"]["authResult"]["authToken"]
    return auth_token
