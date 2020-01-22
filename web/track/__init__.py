from flask import Flask

from track.config import config

def create_app(environment='default'):
    app = Flask(__name__, instance_relative_config=True)

    configuration = config.get(environment, 'default')
    app.config.from_object(configuration)
    configuration.init_app(app)

    app.config.from_pyfile('application.cfg', silent=True)

    from track.cache import cache
    cache.init_app(app)

    from track import views
    views.register(app)

    from track import helpers
    helpers.register(app)

    from track.models import db
    db.init_app(app)

    return app
