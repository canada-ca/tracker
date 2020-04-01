from flask import Flask

from app.logger import logger

from db import (
    db,
    DB_NAME,
    DB_HOST,
    DB_PASS,
    DB_USER,
    DB_PORT
)

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}'
app.config['SQLALCHEMY_COMMIT_ON_TEARDOWN'] = True
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True


def create_application():

    app.debug = True
    db.init_app(app)

    return app
