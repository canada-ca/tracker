from flask import Flask

from app.logger import logger
from app.create_sa import create_sa

app = Flask(__name__)


def create_application():

    app.debug = True
    create_sa()

    return app
