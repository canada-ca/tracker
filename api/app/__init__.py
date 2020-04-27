from flask import Flask
from app.logger import logger
from flask_bcrypt import Bcrypt

app = Flask(__name__)
bcrypt = Bcrypt(app)


def create_application():
    app.debug = True
    return app
