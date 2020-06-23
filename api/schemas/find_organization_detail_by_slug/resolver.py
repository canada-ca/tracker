from graphql import GraphQLError

from app import logger
from db import db_session
from functions.auth_wrappers import require_token
from functions.auth_functions import is_user_read
from models import Organizations
from schemas.organizations import Organization
from functions.input_validators import cleanse_input


@require_token
def resolve_find_organization_detail_by_slug(self: Organization, info, **kwargs):
    """
    This function is to resolve the organization query which takes in an
    organization enum as an argument, which is then checked against the user
    roles against the auth functions, and filters based on those results
    :param self: Organization SQLAlchemyObject type defined in the schemas
    directory
    :param info: Request information sent to the sever from a client
    :param kwargs: Field arguments (i.e. org), and user_roles
    :return: Filtered Organization SQLAlchemyObject Type
    """
    # Get Information from kwargs
    slug = cleanse_input(kwargs.get("slug"))
    user_id = kwargs.get("user_id")
    user_roles = kwargs.get("user_roles")

    # Gather Initial Organization Query Object
    query = Organization.get_query(info)

    # Get org orm to gather its id
    org_orm = db_session.query(Organizations).filter(Organizations.slug == slug).first()

    # if org cannot be found
    if not org_orm:
        logger.warning(
            f"User: {user_id} attempted to access an organization using {slug}, but no organization was not found."
        )
        raise GraphQLError("Error, unable to find organization.")
    org_id = org_orm.id

    # Check to ensure user has access to given org
    if is_user_read(user_roles=user_roles, org_id=org_id):
        query_rtn = query.filter(Organizations.slug == slug).first()
        logger.info(
            f"User: {user_id} successfully retrieved organization info for {slug}"
        )

    else:
        logger.warning(
            f"User: {user_id} attempted to access an organization using {slug}, but does not have access to this organization"
        )
        raise GraphQLError("Error, unable to find organization.")

    return query_rtn
