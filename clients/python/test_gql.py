import re
from src.tracker_client import get_auth_token, create_client, create_transport

"""These are not very good tests as they do actually connect to the API.
Will be replaced as soon as I work out a good solution for mocking the API"""


def test_get_auth_token():
    """Check to see if get_auth_token returns a proper token.
    Will fail if credentials are not present in environmental variables.
    """
    assert re.match(
        r"^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$", get_auth_token()
    )


def test_create_client():
    """Check that create_client creates a client.
    Need to figure out a better test for this"""
    client = create_client("https://tracker.alpha.canada.ca/graphql")
    assert client is not None
    assert client.transport is not None
