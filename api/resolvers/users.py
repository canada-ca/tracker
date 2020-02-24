import pyotp
import os


<<<<<<< HEAD
@query_jwt_required
def resolve_test_user_claims(self, info):
    """
    This resolver returns the user_claims array -- A utility for testing
    It requires that a JWT token be active, and that the user have an admin role
    :returns: Returns the user_claims if user is an admin, raises error message if not.
    """
    role = get_jwt_claims()['roles']

    if is_admin(role):
        return str(get_jwt_claims())
    else:
        raise GraphQLError(error_not_an_admin())


=======
>>>>>>> Current user role testing now working. Added in user_read, and user_write roles
def resolve_generate_otp_url(self, info, email):
    """
    This resolver adds an api endpoint that returns a url for OTP validation
    :param email: The email address that will be associated with the URL generated
    :returns: The url that was generated.
    """
    totp = pyotp.totp.TOTP(os.getenv('BASE32_SECRET'))  # This needs to be a 16 char base32 secret key
    return totp.provisioning_uri(email, issuer_name="Tracker")
