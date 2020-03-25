from graphql import GraphQLError

from db import db

from functions.input_validators import cleanse_input
from functions.auth_wrappers import require_token
from functions.auth_functions import is_super_admin, is_user_read

from models import Domains, Dmarc_Reports

from schemas.domain.dmarc_report import DmarcReport


@require_token
def resolve_dmarc_reports(self: DmarcReport, info, **kwargs):
    """

    :param self:
    :param info:
    :param kwargs:
    :return:
    """
    user_id = kwargs.get('user_id')
    user_roles = kwargs.get('user_roles')
    domain = cleanse_input(kwargs.get('domain'))
    start_date = kwargs.get('start_date')
    end_date = kwargs.get('end_date')

    if (start_date is not None and end_date is None) or \
        (start_date is None and end_date is not None):
        raise GraphQLError('Error, both start and end dates are required.')

    if (start_date and end_date) is not None:
        # Get Domain ORM
        domain_orm = db.session.query(Domains).filter(
            Domains.domain == domain
        ).first()

        org_id = domain_orm.organization_id
        domain_id = domain_orm.id

        # Check if domain exists
        if domain_orm is None:
            raise GraphQLError('Error, this domain does not exist.')

        # Get initial query
        query = DmarcReport.get_query(info)

        # Filter Based on dates
        query = query.filter(
            Dmarc_Reports.start_date.between(start_date, end_date)
        ).filter(
            Dmarc_Reports.start_date.between(start_date, end_date)
        )

        # Check Permissions
        if is_user_read(user_role=user_roles, org_id=org_id):
            query = query.filter(
                Dmarc_Reports.domain_id == domain_id
            )
            return query.all()
        else:
            raise GraphQLError('Error, you do not have access to view this organization.')

    else:
        # Get Domain ORM
        domain_orm = db.session.query(Domains).filter(
            Domains.domain == domain
        ).first()

        org_id = domain_orm.organization_id
        domain_id = domain_orm.id

        # Check if domain exists
        if domain_orm is None:
            raise GraphQLError('Error, this domain does not exist.')

        # Get initial query
        query = DmarcReport.get_query(info)

        # Check Permissions
        if is_user_read(user_role=user_roles, org_id=org_id):
            query = query.filter(
                Dmarc_Reports.domain_id == domain_id
            )
            return query.all()
        else:
            raise GraphQLError('Error, you do not have access to view this organization.')
