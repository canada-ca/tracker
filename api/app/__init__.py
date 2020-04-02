from flask import Flask

from app.logger import logger


app = Flask(__name__)


def create_application():

    app.debug = True

    return app
