from graphene.test import Client
from json_web_token import tokenize, auth_header
from backend.security_check import SecurityAnalysisBackend
from queries import schema

default_backend = SecurityAnalysisBackend()


def run(
    query=None, mutation=None, as_user=None, schema=schema, backend=default_backend
):
    header = auth_header(tokenize(user_id=as_user.id)) if as_user is not None else None

    return Client(schema).execute(
        query if query else mutation, context_value=header, backend=backend
    )
