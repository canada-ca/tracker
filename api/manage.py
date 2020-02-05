import os

from flask_migrate import Migrate, MigrateCommand, init, migrate, upgrade
from flask_script import Manager

from app import app

from db import db

db.init_app(app)
migrate_app = Migrate(app, db)

manager = Manager(app)
manager.add_command('db', MigrateCommand)

if __name__ == '__main__':
	manager.run()
