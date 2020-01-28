from flask import Flask
from flask_graphql import GraphQLView
from waitress import serve

from db import db_session
from queries import schema

app = Flask(__name__)
app.debug = True

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
