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

from functions.db_seeding import (
    seed_admin_aff, remove_admin_aff,
    seed_admin, remove_admin,
    seed_ciphers, remove_ciphers,
    seed_classification, remove_classification,
    seed_dkim, remove_dkim,
    seed_dmarc, remove_dmarc,
    seed_domains, remove_domains,
    seed_groups, remove_groups,
    seed_guidance, remove_guidance,
    seed_http, remove_http,
    seed_org, remove_org,
    seed_scans, remove_scans,
    seed_sectors, remove_sectors,
    seed_spf, remove_spf,
    seed_ssl, remove_ssl,
    seed_user_aff, remove_user_aff,
    seed_users, remove_users
)

app = Flask(__name__)
app.config[
    'SQLALCHEMY_DATABASE_URI'] = f'postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}'
app.config['SQLALCHEMY_COMMIT_ON_TEARDOWN'] = True
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True

db.init_app(app)
migrate_app = Migrate(app, db)

manager = Manager(app)
manager.add_command('db', MigrateCommand)


@manager.command
def seed():
    """
    Cli command allows the insertion of data into db
    """
    seed_guidance(db)
    seed_classification(db)
    seed_ciphers(db)
    seed_sectors(db)
    seed_groups(db)
    seed_org(db)
    seed_domains(db)
    seed_users(db)
    seed_user_aff(db)
    seed_admin(db)
    seed_admin_aff(db)
    seed_scans(db)
    seed_dmarc(db)
    seed_spf(db)
    seed_http(db)
    seed_ssl(db)
    seed_dkim(db)


@manager.command
def remove_seed():
    """
	Cli command allows the removal of seeded data from the db
	"""
    remove_dkim(db)
    remove_ssl(db)
    remove_http(db)
    remove_spf(db)
    remove_dmarc(db)
    remove_scans(db)
    remove_admin_aff(db)
    remove_admin(db)
    remove_user_aff(db)
    remove_users(db)
    remove_domains(db)
    remove_org(db)
    remove_groups(db)
    remove_sectors(db)
    remove_ciphers(db)
    remove_classification(db)
    remove_guidance(db)


if __name__ == '__main__':
    manager.run()
