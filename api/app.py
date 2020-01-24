from flask import Flask
from flask_graphql import GraphQLView

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
	# Remove DB Session

if __name__ == '__main__':
	app.run()