from flask_graphql_auth import *
import pyotp
import os


@query_jwt_required
def resolve_test_user_claims(self, info):
    role = get_jwt_claims()['roles']

    if role == "admin":
        return str(get_jwt_claims())
    else:
        return str("Not an admin, please log in")


def resolve_generate_otp_url(self, info, email):
    totp = pyotp.totp.TOTP(os.getenv('BASE32_SECRET'))  # This needs to be a 16 char base32 secret key
    return totp.provisioning_uri(email, issuer_name="Tracker")
