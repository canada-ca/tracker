from graphql import GraphQLError
from sqlalchemy.orm import load_only

from db import db_session
from functions.auth_wrappers import require_token
from functions.auth_functions import is_super_admin, is_user_read
from models import Domains, Organizations
from schemas.domain import Domain


@require_token
def resolve_domain(self: Domain, info, **kwargs):
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
    url_slug = kwargs.get("url_slug")
    user_roles = kwargs.get("user_roles")

    # Get initial Domain Query Object
    query = Domain.get_query(info)

    # Get org id that is related to the domain
    org_orm = (
        db_session.query(Organizations)
        .filter(Organizations.id == Domains.organization_id)
        .filter(Domains.slug == url_slug)
        .first()
    )

    # If org cannot be found
    if not org_orm:
        raise GraphQLError("Error, unable to find domain.")
    org_id = org_orm.id

    # Check if user has read access or higher to the requested organization
    if is_user_read(user_roles=user_roles, org_id=org_id):
        query_rtn = (
            query.filter(Domains.slug == url_slug)
            .filter(Domains.organization_id == org_id)
            .all()
        )
    else:
        raise GraphQLError("Error, unable to find domain.")

    return query_rtn


@require_token
def resolve_domains(self, info, **kwargs):
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
    org_slug = kwargs.get("org_slug")
    user_roles = kwargs.get("user_roles")

    # Generate list of org's the user has access to
    org_ids = []
    for role in user_roles:
        org_ids.append(role["org_id"])

    if not org_ids:
        raise GraphQLError("Error, unable to find domains.")

    # Retrieve information based on query
    query = Domain.get_query(info)

    if org_slug:
        # Retrieve org id from organization enum
        org_orms = (
            db_session.query(Organizations)
            .filter(Organizations.slug == org_slug)
            .options(load_only("id"))
        )

        # Check if org exists
        if not len(org_orms.all()):
            raise GraphQLError("Error, unable to find organization.")

        # Convert to int id
        org_id = org_orms.first().id

        # Check if user has permission to view org
        if is_user_read(user_roles, org_id):
            query_rtn = query.filter(Domains.organization_id == org_id).all()

            # If org has no domains related to it
            if not len(query_rtn):
                raise GraphQLError("Error, unable to find domains.")
        else:
            raise GraphQLError("Error, unable to find domains.")

        return query_rtn
    else:
        if is_super_admin(user_roles=user_roles):
            query_rtn = query.all()
            if not query_rtn:
                raise GraphQLError("Error, unable to find domains.")
            return query_rtn
        else:
            query_rtr = []
            for org_id in org_ids:
                if is_user_read(user_roles=user_roles, org_id=org_id):
                    tmp_query = query.filter(Domains.organization_id == org_id).all()
                    for item in tmp_query:
                        query_rtr.append(item)
            if not query_rtr:
                raise GraphQLError("Error, unable to find domains.")
            return query_rtr
