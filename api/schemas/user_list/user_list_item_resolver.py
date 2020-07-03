from graphql import GraphQLError

from app import logger
from db import db_session
from functions.auth_functions import is_admin
from functions.auth_wrappers import require_token
from models.Organizations import Organizations
from models.User_affiliations import User_affiliations
from schemas.user_list.user_list_item import UserListItem


@require_token
def resolve_user_item(self, info, **kwargs):
    """
    This function is used to resolve the UserList graphql object. The orgSlug
    given in the arguments will get all the users in that organizations.
    :param self: UserList SQLAlchemyObject type defined in the schemas directory
    :param info: Request information sent to the sever from a client
    :param kwargs: Field arguments and user_roles
    :return: Filtered User SQLAlchemyObject Type
    """
    # Get arguments from kwargs
    user_id = kwargs.get("user_id")
    user_roles = kwargs.get("user_roles")
    org_slug = kwargs.get("org_slug")

    org_orm = (
        db_session.query(Organizations).filter(Organizations.slug == org_slug).first()
    )

    if org_orm is None:
        logger.warning(
            f"User: {user_id} tried to access user list for org {org_slug} but org does not exist."
        )
        raise GraphQLError("Error, unable to access user list.")

    query = UserListItem.get_query(info)

    if is_admin(user_roles=user_roles, org_id=org_orm.id):
        query = (
            query.filter(User_affiliations.organization_id == org_orm.id)
            .order_by(User_affiliations.id.asc())
            .all()
        )
        logger.info(f"User: {user_id} successfully retrieved user list for {org_slug}.")
        return query
    else:
        logger.warning(
            f"User: {user_id} tried to access user list for {org_slug} but does not have access to org."
        )
        raise GraphQLError("Error, unable to access user list.")
