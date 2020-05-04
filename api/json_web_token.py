import jwt
from werkzeug.test import create_environ
from flask import Request
from operator import itemgetter
from datetime import datetime as dt, timedelta
from os import environ


def tokenize(
    user_id,
    roles,
    iat=dt.utcnow(),
    exp=(dt.utcnow() + timedelta(hours=1)),
    # TODO: SUPER_SECRET_SALT isn't actually a salt! Give this a better name.
    secret=environ.get("SUPER_SECRET_SALT", ""),
):
    return jwt.encode(
        {"exp": exp, "iat": iat, "user_id": user_id, "roles": roles},
        secret,
        algorithm="HS256",
    ).decode("utf-8")

def auth_header(token):
    env = create_environ()
    env.update(HTTP_AUTHORIZATION=token)
    return Request(env)
