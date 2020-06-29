from graphql import GraphQLError

from app import logger
from db import db_session
from functions.auth_wrappers import require_token
from functions.auth_functions import is_user_read
from functions.input_validators import cleanse_input
from models import Domains, Organizations
from schemas.shared_structures.domain import Domain


@require_token
def resolve_find_domain_by_slug(self: Domain, info, **kwargs):
    """
    This function is to resolve the domain query which takes in a url as a URL
    scalar and checks against the user roles passed in by the Authorization
    header, and return filtered results depending on the users access level
    :param self: Domain SQLAlchemyObject type defined in the schemas directory
    :param info: Request information sent to the sever from a client
    :param kwargs: Field arguments (i.e. url), and user_roles
    :return: Filtered Domain SQLAlchemyObject Type
    """
    # Get Information passed in via kwargs
    user_id = kwargs.get("user_id")
    user_roles = kwargs.get("user_roles")
    url_slug = cleanse_input(kwargs.get("input", {}).get("url_slug"))

    # Get initial Domain Query Object
    query = Domain.get_query(info)

    domain_orm = db_session.query(Domains).filter(Domains.slug == url_slug).first()
    if not domain_orm:
        logger.warning(
            f"User: {user_id} attempted to access a domain using {url_slug}, but domain was not found."
        )
        raise GraphQLError("Error, unable to find domain.")

    # Get org id that is related to the domain
    org_orm = (
        db_session.query(Organizations)
        .filter(Organizations.id == Domains.organization_id)
        .filter(Domains.slug == url_slug)
        .first()
    )

    # If org cannot be found
    if not org_orm:
        logger.warning(
            f"User: {user_id} attempted to access a domain using {url_slug}, but no organization was not found."
        )
        raise GraphQLError("Error, unable to find domain.")
    org_id = org_orm.id

    # Check if user has read access or higher to the requested organization
    if is_user_read(user_roles=user_roles, org_id=org_id):
        query_rtn = (
            query.filter(Domains.slug == url_slug)
            .filter(Domains.organization_id == org_id)
            .first()
        )
        logger.info(
            f"User: {user_id} successfully retrieved the domain information for {url_slug}"
        )
        if not query_rtn:
            logger.info(
                f"User: {user_id} attempted to access a domain using {url_slug}, but no domain was found."
            )
            raise GraphQLError("Error, unable to find domain.")
    else:
        logger.warning(
            f"User: {user_id} attempted to access a domain using {url_slug}, but does not have access to {org_orm.slug}."
        )
        raise GraphQLError("Error, unable to find domain.")

    return query_rtn
