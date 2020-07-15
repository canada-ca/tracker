import graphene

from enums.roles import RoleEnums
from functions.auth_wrappers import require_token
from scalars.email_address import EmailAddress
from scalars.slug import Slug
from schemas.update_user_role.update_role import update_user_role


class UpdateUserRoleInput(graphene.InputObjectType):
    """

    """

    user_name = EmailAddress(
        required=True,
        description="The username of the user you wish to update their role to.",
    )
    org_slug = Slug(
        required=True,
        description="The organization that the admin, and the user both belong to.",
    )
    role = RoleEnums(
        required=True,
        description="The role that the admin wants to give to the selected user.",
    )


class UpdateUserRole(graphene.Mutation):
    """
    This mutation allows super admins, and admins of the given organization to
    update the permission level of a given user that already belongs to the
    given organization.
    """

    class Arguments:
        input = UpdateUserRoleInput(
            required=True,
            description="UpdateUserRoleInput object containing all the input fields for this mutation.",
        )

    status = graphene.String(description="The status of updating the user role.")

    @require_token
    def mutate(self, info, **kwargs):
        update_user_role(**kwargs)
        return UpdateUserRole(status="User role has been successfully updated.")
