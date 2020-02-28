from waitress import serve
from flask import Flask

from app import create_application
# from app.graphql_endpoint import add_graphql_endpoint

app = Flask(__name__)

create_application(app)
# add_graphql_endpoint(app)

if __name__ == '__main__':
    serve(app, host='0.0.0.0', port=5000)
