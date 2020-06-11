from functions.auth_functions import is_admin
from functions.auth_wrappers import require_token
from schemas.is_user_admin.is_user_admin import IsUserAdmin


@require_token
def resolve_is_user_admin(self, info, **kwargs):
    """

    :param self:
    :param info:
    :param kwargs:
    :return:
    """
    user_roles = kwargs.get("user_roles")

    for role in user_roles:
        if is_admin(user_roles=user_roles, org_id=role.get("org_id")):
            return IsUserAdmin(True)

    return IsUserAdmin(False)
