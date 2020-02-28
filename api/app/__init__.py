from db import (
    db,
    DB_NAME,
    DB_HOST,
    DB_PASS,
    DB_USER,
    DB_PORT
)


def create_application(application):
    application.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}'
    application.config['SQLALCHEMY_COMMIT_ON_TEARDOWN'] = True
    application.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True
    application.debug = True
    db.init_app(application)

    return application
