import os
import graphene

from graphql import GraphQLError
from notifications_python_client.notifications import NotificationsAPIClient

from app import logger
from db import db_session
from enums.roles import RoleEnums
from functions.auth_functions import is_admin
from functions.auth_wrappers import require_token
from functions.input_validators import cleanse_input
from models import Organizations, User_affiliations, Users
from scalars.email_address import EmailAddress
from scalars.slug import Slug
from schemas.invite_user_to_org.send_added_to_org_email import (
    send_invite_notification_email,
)


class InviteUserToOrgInput(graphene.InputObjectType):
    """

    """

    user_name = EmailAddress(
        required=True,
        description="User's email that you would like to invite to your org.",
    )
    requested_role = RoleEnums(
        required=True, description="The role which you would like this user to have."
    )
    org_slug = Slug(
        required=True, description="The organization you wish to invite the user to."
    )


class InviteUserToOrg(graphene.Mutation):
    """

    """

    class Arguments:
        input = InviteUserToOrgInput(
            required=True,
            description="Input object containing fields for inviteUserToOrg mutation.",
        )

    status = graphene.String(description="Status of inviting user to organization.")

    @require_token
    def mutate(self, info, **kwargs):
        """

        :param info:
        :param kwargs:
        :return:
        """
        # Get Arguments
        user_id = kwargs.get("user_id")
        user_roles = kwargs.get("user_roles")
        user_name = cleanse_input(kwargs.get("input", {}).get("user_name"))
        requested_role = cleanse_input(kwargs.get("input", {}).get("requested_role"))
        org_slug = cleanse_input(kwargs.get("input", {}).get("org_slug"))

        # Check to make sure user_name and requested_role are not none
        if (
            (user_name is not None)
            and (requested_role is not None)
            and (org_slug is not None)
        ):
            # Check to see if user exists
            user = Users.find_by_user_name(user_name=user_name)
            org = (
                db_session.query(Organizations)
                .filter(Organizations.slug == org_slug)
                .first()
            )
            if user is not None and org is not None:
                if is_admin(user_roles=user_roles, org_id=org.id) is True:
                    # Stop if permission is super_admin
                    if requested_role == "super_admin":
                        raise GraphQLError(
                            "Error, you cannot invite a user with a super admin role."
                        )

                    # Check to see if affiliation already exists
                    check_affiliation = (
                        db_session.query(User_affiliations)
                        .filter(User_affiliations.user_id == user.id)
                        .filter(User_affiliations.organization_id == org.id)
                        .first()
                    )
                    if check_affiliation is not None:
                        logger.warning(
                            f"User: {user_id}, attempted to add {user.id} to {org_slug}, but that user is already assigned to that organization."
                        )
                        raise GraphQLError(
                            f"Error, that user is already part of {org_slug}."
                        )

                    new_user_affilition = User_affiliations(
                        organization_id=org.id,
                        user_organization=org,
                        user_id=user_id,
                        user=user,
                        permission=requested_role,
                    )

                    try:
                        send_invite_notification_email(
                            user=user,
                            org_name=org.name,
                            client=NotificationsAPIClient(
                                api_key=os.getenv("NOTIFICATION_API_KEY"),
                                base_url=os.getenv("NOTIFICATION_API_URL"),
                            ),
                        )
                        db_session.add(new_user_affilition)
                        db_session.commit()
                        logger.info(
                            f"User: {user_id} successfully added {user.id} to {org_slug}."
                        )
                        return InviteUserToOrg(
                            status="Successfully invited user to organization, and sent notification email."
                        )
                    except Exception as e:
                        logger.error(
                            f"User: {user_id} attempted to invite {user.id} to org, but a db error occurred when adding user: {str(e)}"
                        )
                        raise GraphQLError(
                            "Error, invite user to org failed, please try again."
                        )
                else:
                    logger.warning(
                        f"User: {user_id} attempted to invite user to {org_slug}, but does not have admin access."
                    )
                    raise GraphQLError(
                        "Error, you do not have access to invite users this organization."
                    )

            elif user is None and org is not None:
                # Send Email
                raise GraphQLError("Error, not implemented yet.")

            elif org is None:
                logger.warning(
                    f"User: {user_id}, attempted to invite {user_name} to {org_slug}, but org does not exist."
                )
                raise GraphQLError(
                    "Error, invite user to org failed, please try again."
                )

        else:
            if (
                user_name is None
                and requested_role is not None
                and org_slug is not None
            ):
                logger.warning(
                    f"User: {user_id}, attempted to invite user to org, but user_name is None"
                )
            elif (
                user_name is not None
                and requested_role is None
                and org_slug is not None
            ):
                logger.warning(
                    f"User: {user_id}, attempted to invite user to org, but requested_role is None"
                )
            elif (
                user_name is not None
                and requested_role is not None
                and org_slug is None
            ):
                logger.warning(
                    f"User: {user_id}, attempted to invite user to org, but org_slug is None"
                )
            else:
                logger.warning(
                    f"User: {user_id}, attempted to invite user to org, but requested_role, and user_name is None"
                )

            raise GraphQLError("Error, invite user to org failed, please try again.")
