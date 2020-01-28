import os

from flask import Flask
from flask_graphql import GraphQLView
from flask_graphql_auth import GraphQLAuth
from waitress import serve

from db import db_session
from queries import schema

app = Flask(__name__)
app.debug = True

auth = GraphQLAuth(app)


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


@app.teardown_appcontext
def shutdown_session(execption=None):
	db_session.remove()


if __name__ == '__main__':
	# init_db()
	serve(app, host='0.0.0.0', port=5000)
