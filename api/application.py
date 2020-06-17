from waitress import serve
from app import create_application
from app.graphql_endpoint import add_graphql_endpoint
from db import db_session
from app.create_sa import create_sa

app = create_application()
add_graphql_endpoint(app)


@app.before_first_request
def setup_super_admin():
    create_sa()


@app.teardown_request
def shutdown_session(exception=None):
    db_session.remove()


if __name__ == "__main__":
    serve(app, host="0.0.0.0", port=5000)
