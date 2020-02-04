import os

from flask import Flask
from flask_graphql import GraphQLView
from flask_graphql_auth import GraphQLAuth
from flask_migrate import Migrate, MigrateCommand, init, migrate, upgrade
from flask_script import Manager
from waitress import serve


from db import db
from queries import schema


app = Flask(__name__)
app.debug = True

auth = GraphQLAuth(app)

DB_USER = os.getenv('DB_USER')
DB_PASS = os.getenv('DB_PASS')
DB_HOST = os.getenv('DB_HOST')
DB_PORT = os.getenv('DB_PORT')
DB_NAME = os.getenv('DB_NAME')

app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}/track_dmarc'
app.config['SQLALCHEMY_COMMIT_ON_TEARDOWN'] = True
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True

db.init_app(app)
migrate_app = Migrate(app, db)

manager = Manager(app)
manager.add_command('db', MigrateCommand)

app.config["JWT_SECRET_KEY"] = os.getenv('SUPER_SECRET_KEY')
app.config["REFRESH_EXP_LENGTH"] = 30
app.config["ACCESS_EXP_LENGTH"] = 10


app.add_url_rule(
	'/graphql',
	view_func=GraphQLView.as_view(
		'graphql',
		schema=schema,
		graphiql=True
	)
)


if __name__ == '__main__':
	# serve(app, host='0.0.0.0', port=5000)
	manager.run()
