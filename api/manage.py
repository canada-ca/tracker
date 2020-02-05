import os

from flask_migrate import Migrate, MigrateCommand, init, migrate, upgrade
from flask_script import Manager

from app import app

from db import (
	db,
	DB_NAME,
	DB_HOST,
	DB_PASS,
	DB_USER,
	DB_PORT
)

app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}'
app.config['SQLALCHEMY_COMMIT_ON_TEARDOWN'] = True
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True

db.init_app(app)
migrate_app = Migrate(app, db)

manager = Manager(app)
manager.add_command('db', MigrateCommand)

if __name__ == '__main__':
	manager.run()
