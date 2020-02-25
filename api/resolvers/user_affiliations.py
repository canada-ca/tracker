from graphql import GraphQLError
from sqlalchemy.orm import load_only

from models import Organizations
from functions.error_messages import error_not_an_admin
from user_roles import is_super_admin


def resolve_test_user_claims(self, info, **kwargs):
    """
    This resolver returns the user_claims array -- A utility for testing
    It requires that a JWT token be active, and that the user have an admin role
    :returns: Returns the user_claims if user is an admin, raises error message if not.
    """
    org = kwargs.get('org')

    if is_super_admin(roles, org):
        return "Passed"
    else:
        raise GraphQLError(str(error_not_an_admin()))
