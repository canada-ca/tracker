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
    seed_ciphers, remove_ciphers,
    seed_classification, remove_classification,
    seed_dkim, remove_dkim,
    seed_dmarc, remove_dmarc,
    seed_domains, remove_domains,
    seed_guidance, remove_guidance,
    seed_http, remove_http,
    seed_org, remove_org,
    seed_scans, remove_scans,
    seed_spf, remove_spf,
    seed_ssl, remove_ssl,
    seed_user_aff, remove_user_aff,
    seed_users, remove_users
)

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}'
app.config['SQLALCHEMY_COMMIT_ON_TEARDOWN'] = True
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True

db.init_app(app)
migrate_app = Migrate(app, db)

manager = Manager(app)
manager.add_command('db', MigrateCommand)


@manager.command
def seed():
    """Cli command allows the insertion of data into db"""
    seed_guidance(db, app)
    seed_classification(db, app)
    seed_ciphers(db, app)
    seed_org(db, app)
    seed_domains(db, app)
    seed_users(db, app)
    seed_user_aff(db, app)
    seed_scans(db, app)
    seed_dmarc(db, app)
    seed_spf(db, app)
    seed_http(db, app)
    seed_ssl(db, app)
    seed_dkim(db, app)


@manager.command
def remove_seed():
    """Cli command allows the removal of seeded data from the db"""
    remove_dkim(db, app)
    remove_ssl(db, app)
    remove_http(db, app)
    remove_spf(db, app)
    remove_dmarc(db, app)
    remove_scans(db, app)
    remove_user_aff(db, app)
    remove_users(db, app)
    remove_domains(db, app)
    remove_org(db, app)
    remove_ciphers(db, app)
    remove_classification(db, app)
    remove_guidance(db, app)


if __name__ == '__main__':
    manager.run()
