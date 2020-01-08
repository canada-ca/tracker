from flask import Flask
from flask_compress import Compress

from track.config import config

def create_app(environment='default'):
    app = Flask(__name__, instance_relative_config=True)

    # Gzip compress most things
    app.config['COMPRESS_MIMETYPES'] = [
        'text/html', 'text/css', 'text/xml',
        'text/csv', 'application/json', 'application/javascript'
    ]
    configuration = config.get(environment, 'default')
    app.config.from_object(configuration)
    configuration.init_app(app)

    app.config.from_pyfile('application.cfg', silent=True)

    Compress(app)

    from track.cache import cache
    cache.init_app(app)

    from track import views
    views.register(app)

    from track import helpers
    helpers.register(app)

    from track.models import db
    db.init_app(app)

    return app
