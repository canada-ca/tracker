from graphql import GraphQLError

from app import logger
from functions.auth_wrappers import require_token
from functions.auth_functions import is_super_admin, is_user_read
from models import Domains
from schemas.shared_structures.domain import Domain


@require_token
def resolve_find_my_domains(self, info, **kwargs):
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

    # Generate list of org's the user has access to
    org_ids = []
    for role in user_roles:
        org_ids.append(role["org_id"])

    if not org_ids:
        logger.warning(
            f"User: {user_id} attempted to access their domains, but has no roles assigned."
        )
        raise GraphQLError("Error, unable to find domains.")

    # Retrieve information based on query
    query = Domain.get_query(info)

    if is_super_admin(user_roles=user_roles):
        query_rtn = query.all()
        if not query_rtn:
            logger.info(
                f"Super Admin: {user_id} tried to gather all domains, but none were found."
            )
            raise GraphQLError("Error, unable to find domains.")

        logger.info(
            f"Super Admin: {user_id}, successfully retrieved all domains for all orgs that they have access to."
        )
        return query_rtn
    else:
        query_rtr = []
        for org_id in org_ids:
            if is_user_read(user_roles=user_roles, org_id=org_id):
                tmp_query = query.filter(Domains.organization_id == org_id).all()

                for item in tmp_query:
                    query_rtr.append(item)

        if not query_rtr:
            logger.info(
                f"User: {user_id}, tried to access all the domains for all the orgs that they belong to but none were found."
            )
            raise GraphQLError("Error, unable to find domains.")

        logger.info(
            f"User: {user_id}, successfully retrieved all domains for all orgs that they have access to."
        )
        return query_rtr
