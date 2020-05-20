import jwt
from werkzeug.test import create_environ
from flask import Request
from operator import itemgetter
from datetime import datetime as dt, timedelta
from os import environ


def tokenize(
    user_id,
    iat=None,
    exp=None,
    # TODO: SUPER_SECRET_SALT isn't actually a salt! Give this a better name.
    secret=environ.get("SUPER_SECRET_SALT", ""),
    exp_period=1
):
    if not iat:
        iat = dt.timestamp(dt.utcnow())
    if not exp:
        exp = dt.timestamp(dt.utcnow() + timedelta(hours=exp_period))
    return jwt.encode(
        {"exp": exp, "iat": iat, "user_id": user_id}, secret, algorithm="HS256",
    ).decode("utf-8")


def auth_header(token):
    env = create_environ()
    env.update(HTTP_AUTHORIZATION=token)
    return Request(env)
