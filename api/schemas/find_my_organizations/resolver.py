from graphql import GraphQLError

from app import logger
from functions.auth_wrappers import require_token
from functions.auth_functions import is_super_admin, is_user_read
from models import Organizations as OrgModel
from schemas.shared_structures.organizations import Organizations


@require_token
def resolve_find_my_organizations(self, info, **kwargs):
    """
    This function is used to gather all organization information based
    solely on the user roles that are passed in by the user
    :param self: Organization SQLAlchemyObject type defined in the schemas
    directory
    :param info: Request information sent to the sever from a client
    :param kwargs: Field arguments  and user_roles
    :return: Filtered Organization SQLAlchemyObject Type
    """
    # Get Information from kwargs
    user_id = kwargs.get("user_id")
    user_roles = kwargs.get("user_roles")

    # Generate user Org ID list
    org_ids = []
    for role in user_roles:
        org_ids.append(role["org_id"])

    # Gather Initial Organization Query Object
    query = Organizations.get_query(info)

    # Check to see if user has a super admin claim
    if is_super_admin(user_roles=user_roles):
        query_rtn = query.all()
        # If no org can be matched
        if not len(query_rtn):
            logger.warning(
                f"Super admin: {user_id} tried to access all organzations but none were found"
            )
            raise GraphQLError("Error, unable to find organizations.")

        logger.info(f"Super admin: {user_id} successfully retrieved all organizations.")
        return query_rtn
    # If user fails super admin check
    else:
        # Check to ensure user has access to given org
        query_rtr = []
        for org_id in org_ids:
            if is_user_read(user_roles=user_roles, org_id=org_id):
                tmp_query = query.filter(OrgModel.id == org_id).first()
                query_rtr.append(tmp_query)

        if not query_rtr:
            logger.warning(
                f"User: {user_id} tried to access all organizations, but does not have any affiliations."
            )
            raise GraphQLError("Error, unable to find organizations.")

        logger.info(
            f"User: {user_id} successfully retrieved all organizations that they belong to."
        )
        return query_rtr
