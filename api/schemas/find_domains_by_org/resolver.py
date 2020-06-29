from graphql import GraphQLError
from sqlalchemy.orm import load_only

from app import logger
from db import db_session
from functions.auth_wrappers import require_token
from functions.auth_functions import is_super_admin, is_user_read
from functions.input_validators import cleanse_input
from models import Domains, Organizations
from schemas.shared_structures.domain import Domain


@require_token
def resolve_find_domains_by_org(self, info, **kwargs):
    """
    This function is to resolve the domain query which takes in a url as a URL
    scalar and checks against the user roles passed in by the Authorization
    header, and return filtered results depending on the users access level
    :param self: Domain SQLAlchemyObject type defined in the schemas directory
    :param info: Request information sent to the sever from a client
    :param kwargs: Field arguments (i.e. organization), and user_roles
    :return: Filtered Domain SQLAlchemyObject Type
    """
    # Get Information passed in from kwargs
    user_id = kwargs.get("user_id")
    user_roles = kwargs.get("user_roles")
    org_slug = cleanse_input(kwargs.get("input", {}).get("org_slug"))

    # Generate list of org's the user has access to
    org_ids = []
    for role in user_roles:
        org_ids.append(role["org_id"])

    if not org_ids:
        logger.warning(
            f"User: {user_id} attempted to access domains for this org {org_slug}, but has no roles assigned."
        )
        raise GraphQLError("Error, unable to find domains.")

    # Retrieve information based on query
    query = Domain.get_query(info)

    # Retrieve org id from organization enum
    org_orms = (
        db_session.query(Organizations)
        .filter(Organizations.slug == org_slug)
        .options(load_only("id"))
    )

    # Check if org exists
    if not len(org_orms.all()):
        logger.warning(
            f"User: {user_id} attempted to access an orgnaizations domains using {org_slug}, but no organization was found."
        )
        raise GraphQLError("Error, unable to find organization.")

    # Convert to int id
    org_id = org_orms.first().id

    # Check if user has permission to view org
    if is_user_read(user_roles=user_roles, org_id=org_id):
        query_rtn = query.filter(Domains.organization_id == org_id).all()

        # If org has no domains related to it
        if not len(query_rtn):
            logger.info(
                f"User: {user_id} attempted to access an organizations domains using {org_slug}, but no domains were found."
            )
            raise GraphQLError("Error, unable to find domains.")
    else:
        logger.warning(
            f"User: {user_id} attempted to access an organizations domains using {org_slug}, but does not have access to this organization."
        )
        raise GraphQLError("Error, unable to find domains.")

    logger.info(
        f"User: {user_id}, successfully retrieved all domains for this org {org_slug}."
    )
    return query_rtn
