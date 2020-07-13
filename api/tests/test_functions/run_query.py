from graphene.test import Client
from json_web_token import tokenize, auth_header
from backend.security_check import SecurityAnalysisBackend
from queries import schema

default_backend = SecurityAnalysisBackend()


def run(
    query=None,
    mutation=None,
    as_user=None,
    schema=schema,
    backend=default_backend,
    parameters={},
):
    if as_user is not None:
        parameters.update({"user_id": as_user.id})
        header = auth_header(tokenize(parameters=parameters))
    else:
        header = None

    return Client(schema).execute(
        query if query else mutation, context_value=header, backend=backend
    )
