import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

DB_USER = os.getenv('AZURE_DB_USER')
DB_PASS = os.getenv('AZURE_DB_PASS')
DB_HOST = os.getenv('AZURE_DB_HOST')
DB_NAME = os.getenv('AZURE_DB_NAME')
DB_PORT = os.getenv('AZURE_DB_PORT')


def create_enum_app():
	enum_app = Flask(__name__)

	enum_app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}'
	enum_app.config['SQLALCHEMY_COMMIT_ON_TEARDOWN'] = True
	enum_app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True
	enum_app.debug = True

	return enum_app


def create_enum_db(enum_app):
	enum_db = SQLAlchemy()
	enum_db.init_app(enum_app)
	return enum_db


# def create_enums():
# 	app = create_enum_app()
# 	db = create_enum_db(app)