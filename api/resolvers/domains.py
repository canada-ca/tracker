from graphql import GraphQLError
from sqlalchemy.orm import load_only

from app import app
from db import db

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
    user_id = kwargs.get('user_id')
    url = kwargs.get('url')
    user_roles = kwargs.get('user_roles')

    # Generate list of org's the user has access to
    org_id_list = []
    for role in user_roles:
        org_id_list.append(role["org_id"])

    # Get initial Domain Query Object
    query = Domain.get_query(info)

    # Get org id that is related to the domain
    org_orm = db.session.query(Organizations).filter(
        Organizations.id == Domains.organization_id
    ).filter(
        Domains.domain == url
    ).first()

    # If org cannot be found
    if not org_orm:
        raise GraphQLError("Error, domain does not exist")
    org_id = org_orm.id

    # Check if user has read access or higher to the requested organization
    if is_user_read(user_roles, org_id):
        query_rtn = query.filter(
            Domains.domain == url
        ).filter(
            Domains.organization_id == org_id
        ).all()
    else:
        raise GraphQLError("Error, you do not have permission to view that domain")

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
    organization = kwargs.get('organization')
    user_role = kwargs.get('user_roles')
    user_id = kwargs.get('user_id')

    # Generate list of org's the user has access to
    org_id_list = []
    for role in user_role:
        org_id_list.append(role["org_id"])

    if not org_id_list:
        raise GraphQLError("Error, you have not been assigned to any organization")

    # Retrieve information based on query
    query = Domain.get_query(info)

    if organization:
        # Retrieve org id from organization enum
        with app.app_context():
            org_orm = db.session.query(Organizations).filter(
                Organizations.acronym == organization
            ).options(load_only('id'))

        # Check if org exists
        if not len(org_orm.all()):
            raise GraphQLError("Error, no organization associated with that enum")

        # Convert to int id
        org_id = org_orm.first().id

        # Check if user has permission to view org
        if is_user_read(user_role, org_id):
            query_rtn = query.filter(
                Domains.organization_id == org_id
            ).all()

            # If org has no domains related to it
            if not len(query_rtn):
                raise GraphQLError("Error, no domains associated with that organization")
        else:
            raise GraphQLError(
                "Error, you do not have permission to view that organization")

        return query_rtn
    else:
        if is_super_admin(user_role=user_role):
            query_rtn = query.all()
            if not query_rtn:
                raise GraphQLError("Error, no domains to view")
            return query_rtn
        else:
            query_rtr = []
            for org_id in org_id_list:
                if is_user_read(user_role, org_id):
                    tmp_query = query.filter(
                        Domains.organization_id == org_id
                    ).first()
                    query_rtr.append(tmp_query)
            if not query_rtr:
                raise GraphQLError("Error, no domains to display")
            return query_rtr

