import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

_called_from_test = False


def create_enum_app():
	enum_app = Flask(__name__)

	if _called_from_test:
		DB_USER = os.getenv('AZURE_DB_USER')
		DB_PASS = os.getenv('AZURE_DB_PASS')
		DB_HOST = os.getenv('AZURE_DB_HOST')
		DB_NAME = os.getenv('AZURE_DB_NAME')
	else:
		DB_USER = os.getenv('DB_USER')
		DB_PASS = os.getenv('DB_PASS')
		DB_HOST = os.getenv('DB_HOST')
		DB_NAME = os.getenv('DB_NAME')

	enum_app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}'
	enum_app.config['SQLALCHEMY_COMMIT_ON_TEARDOWN'] = True
	enum_app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True
	enum_app.debug = True

	return enum_app


def create_enum_db(enum_app):
	enum_db = SQLAlchemy()
	enum_db.init_app(enum_app)

	return enum_db
