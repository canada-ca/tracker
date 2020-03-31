from waitress import serve

from app import create_application
from app.graphql_endpoint import add_graphql_endpoint

from db import db_session

app = create_application()
add_graphql_endpoint(app)


@app.teardown_appcontext
def shutdown_session(exception=None):
    db_session.remove()


if __name__ == '__main__':
    serve(app, host='0.0.0.0', port=5000)
