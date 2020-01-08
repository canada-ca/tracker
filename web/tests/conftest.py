import os
import socket
import flask
import pytest
from track import create_app

def local_mongo_is_running() -> bool:
    if 'CIRCLECI' in os.environ:
        return True

    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        sock.bind(("127.0.0.1", 27017))
    except socket.error:
        return True
    else:
        sock.close()
        return False


@pytest.fixture()
def app() -> flask.Flask:
    if not local_mongo_is_running():
        pytest.skip('Local MongoDB instance is not running.')
    app = create_app('testing')
    return app
