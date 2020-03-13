from graphql import GraphQLError
from sqlalchemy.orm import load_only

from app import app
from db import db

from functions.auth_wrappers import require_token
from functions.auth_functions import is_super_admin, is_user_read

from models import Organizations

from schemas.organizations import Organization


@require_token
def resolve_organization(self: Organization, info, **kwargs):
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
    org = kwargs.get('org')
    user_roles = kwargs.get('user_roles')

    # Generate user Org ID list
    org_id_list = []
    for role in user_roles:
        org_id_list.append(role["org_id"])

    # Gather Initial Organization Query Object
    query = Organization.get_query(info)

    # Check to see if user has a super admin claim
    if is_super_admin(user_role=user_roles):
        query_rtn = query.filter(
            Organizations.acronym == org
        ).all()
        # If no org can be matched
        if not len(query_rtn):
            raise GraphQLError("Error, organization does not exist")
    # If user fails super admin check
    else:
        # Get org orm to gather its id
        org_orm = db.session.query(Organizations).filter(
            Organizations.acronym == org
        ).first()

        # if org cannot be found
        if not org_orm:
            raise GraphQLError("Error, organization does not exist")
        org_id = org_orm.id

        # Check to ensure user has access to given org
        if is_user_read(user_role=user_roles, org_id=org_id):
            query_rtn = query.filter(
                Organizations.acronym == org
            ).all()
        else:
            raise GraphQLError("Error, you do not have permission to view that organization")

    return query_rtn


@require_token
def resolve_organizations(self, info, **kwargs):
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
    org = kwargs.get('org')
    user_roles = kwargs.get('user_roles')

    # Generate user Org ID list
    org_id_list = []
    for role in user_roles:
        org_id_list.append(role["org_id"])

    # Gather Initial Organization Query Object
    query = Organization.get_query(info)

    # Check to see if user has a super admin claim
    if is_super_admin(user_role=user_roles):
        query_rtn = query.all()
        # If no org can be matched
        if not len(query_rtn):
            raise GraphQLError("Error, no organizations to view")
        return query_rtn
    # If user fails super admin check
    else:
        # Check to ensure user has access to given org
        query_rtr = []
        for org_id in org_id_list:
            if is_user_read(user_role=user_roles, org_id=org_id):
                tmp_query = query.filter(
                    Organizations.id == org_id
                ).first()
                query_rtr.append(tmp_query)
        return query_rtr
