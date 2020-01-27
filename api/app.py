from flask import Flask
from flask_graphql import GraphQLView
from flask_graphql_auth import GraphQLAuth

from api.db import db_session
from api.queries import schema

app = Flask(__name__)
app.debug = True

auth = GraphQLAuth(app)


app.config["JWT_SECRET_KEY"] = "something"  # change this!
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
	app.run()
