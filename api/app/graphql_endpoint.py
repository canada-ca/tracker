from queries import schema
from backend.security_check import SecurityAnalysisBackend
from flask_graphql import GraphQLView

backend = SecurityAnalysisBackend(max_depth=20, max_cost=1000)


def add_graphql_endpoint(app):
    app.add_url_rule(
        '/graphql',
        view_func=GraphQLView.as_view(
            'graphql',
            schema=schema,
            backend=backend,
            graphiql=True
        )
    )
