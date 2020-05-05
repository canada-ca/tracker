from graphql import GraphQLError

from app import app
from db import db_session
from models import Organizations as Orgs
from functions.auth_wrappers import require_token
from functions.auth_functions import (
    is_super_admin,
    is_admin,
    is_user_write,
    is_user_read
)


@require_token
def resolve_test_user_claims(self, info, **kwargs):
    """
    This resolver returns the user_claims array -- A utility for testing
    It requires that a JWT token be active, and that the user have an admin role
    :returns: Returns the user_claims if user is an admin, raises error message if not.
    """
    user_roles = kwargs.get('user_roles')
    test_role = kwargs.get('role')
    org = kwargs.get('org')

    org_orm = db_session.query(Orgs).filter(
        Orgs.acronym == org
    ).first()
    org_id = org_orm.id

    if test_role == 'super_admin':
        if is_super_admin(user_roles=user_roles):
            return 'User Passed Super Admin Claim'
        else:
            raise GraphQLError('Error, user is not a super admin')
    elif test_role == 'admin':
        if is_admin(user_roles=user_roles, org_id=org_id):
            return 'User Passed Admin Claim'
        else:
            raise GraphQLError('Error, user is not an admin for that org')
    elif test_role == 'user_write':
        if is_user_write(user_roles=user_roles, org_id=org_id):
            return 'User Passed User Write Claim'
        else:
            raise GraphQLError('Error, user cannot write to that org')
    elif test_role == 'user_read':
        if is_user_read(user_roles=user_roles, org_id=org_id):
            return 'User Passed User Read Claim'
        else:
            raise GraphQLError('Error, user cannot read that org')
    else:
        raise GraphQLError('Error, user has no permissions')
