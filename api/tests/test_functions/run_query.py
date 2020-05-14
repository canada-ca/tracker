from graphene.test import Client
from json_web_token import tokenize, auth_header
from backend.security_check import SecurityAnalysisBackend

default_backend = SecurityAnalysisBackend()


def run(query=None, mutation=None, as_user=None, schema=None, backend=default_backend):
    return Client(schema).execute(
        query if query else mutation,
        context_value=auth_header(tokenize(user_id=as_user.id)),
        backend=backend
    )
