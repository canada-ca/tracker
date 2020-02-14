import os
from flask import Flask
from flask_migrate import Migrate, MigrateCommand, init, migrate, upgrade
from flask_script import Manager

from models import db
from db import (
	DB_NAME,
	DB_HOST,
	DB_PASS,
	DB_USER,
	DB_PORT,
)

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}'
app.config['SQLALCHEMY_COMMIT_ON_TEARDOWN'] = True
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True

db.init_app(app)
migrate_app = Migrate(app, db)

manager = Manager(app)
manager.add_command('db', MigrateCommand)

if __name__ == '__main__':
	manager.run()
