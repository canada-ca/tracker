from app import logger
from functions.auth_functions import is_admin
from functions.auth_wrappers import require_token
from schemas.is_user_admin.is_user_admin import IsUserAdmin


@require_token
def resolve_is_user_admin(self, info, **kwargs):
    """
    This resolver checks to see if the user has any admin roles in any role that
    they have assigned to their account.
    :param self: None
    :param info: Request Object
    :param kwargs: Various arguments passed into function such as user_roles
    :return: IsUserAdmin Type, with filled in field information
    """
    user_id = kwargs.get("user_id")
    user_roles = kwargs.get("user_roles")

    for role in user_roles:
        if is_admin(user_roles=user_roles, org_id=role.get("org_id")):
            logger.info(
                f"User: {user_id} checked for any admin roles, and found at least one."
            )
            return IsUserAdmin(True)

    logger.info(
        f"User: {user_id} checked for any admin roles, but did not find at least one."
    )
    return IsUserAdmin(False)
