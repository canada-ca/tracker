import os

from flask import Flask
from flask_graphql import GraphQLView
from waitress import serve
from db import (
    db,
    DB_NAME,
    DB_HOST,
    DB_PASS,
    DB_USER,
    DB_PORT
)
from queries import schema

app = Flask(__name__)

app.config[
    'SQLALCHEMY_DATABASE_URI'] = f'postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}'
app.config['SQLALCHEMY_COMMIT_ON_TEARDOWN'] = True
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True
app.debug = True

db.init_app(app)

app.add_url_rule(
    '/graphql',
    view_func=GraphQLView.as_view(
        'graphql',
        schema=schema,
        graphiql=True
    )
)

if __name__ == '__main__':
    serve(app, host='0.0.0.0', port=5000)
