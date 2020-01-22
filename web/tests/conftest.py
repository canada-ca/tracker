import os
import socket
import flask
import pytest
from track import create_app

@pytest.fixture()
def app() -> flask.Flask:
    app = create_app('testing')
    return app
