import pytest
import jwt

from datetime import datetime as dt, timedelta
from json_web_token import tokenize
from os import environ


def test_that_it_generates_a_token():

    token = tokenize(user_id=1, secret="secret")

    decoded = jwt.decode(token, "secret", algorithms=["HS256"])
    exp, iat, user_id = decoded.values()
    assert user_id is 1


def test_tokens_expire_in_one_hour_by_default():

    token = tokenize(user_id=1, secret="secret")
    decoded = jwt.decode(token, "secret", algorithms=["HS256"])

    exp, iat, _ = decoded.values()
    created = dt.fromtimestamp(iat)
    expiry = dt.fromtimestamp(exp)

    auth_duration_in_seconds = int((expiry - created).total_seconds())
    assert auth_duration_in_seconds == 3600  # 1 hour


def test_accepts_an_iat_and_exp_argument_to_allow_custom_expiry_dates():
    now = dt.utcnow()
    token = tokenize(
        user_id=1, secret="secret", iat=now, exp=now + timedelta(seconds=100),
    )
    decoded = jwt.decode(token, "secret", algorithms=["HS256"])

    exp, iat, _ = decoded.values()

    created = dt.fromtimestamp(iat)
    expiry = dt.fromtimestamp(exp)

    auth_duration_in_seconds = int((expiry - created).total_seconds())
    assert auth_duration_in_seconds == 100  # 1 day


def test_it_uses_a_secret_from_the_env_if_no_secret_arg_is_passed():
    secret_from_the_environment = environ.get("SUPER_SECRET_SALT", "")

    token = tokenize(user_id=1)

    decoded = jwt.decode(token, secret_from_the_environment, algorithms=["HS256"])
    _, _, user_id = decoded.values()

    assert user_id is 1
