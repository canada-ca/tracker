from queries import schema
from backend import DepthAnalysisBackend
from flask_graphql import GraphQLView

backend = DepthAnalysisBackend()


def add_graphql_endpoint(app):
    app.add_url_rule(
        '/graphql',
        view_func=GraphQLView.as_view(
            'graphql',
            schema=schema,
            backend=DepthAnalysisBackend(),
            graphiql=True
        )
    )
