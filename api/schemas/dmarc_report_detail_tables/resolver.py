import os
import calendar
import gql

from datetime import datetime, timedelta
from graphql import GraphQLError

from app import logger
from db import db_session
from enums.period import PeriodEnums
from functions.auth_functions import is_user_read
from functions.auth_wrappers import require_token
from functions.external_graphql_api_request import send_request
from functions.input_validators import cleanse_input
from functions.start_end_date_generation import generate_start_end_date
from models import Domains
from schemas.dmarc_report_detail_tables.dmarc_report_detail_tables import (
    DmarcReportDetailTables,
)
from schemas.dmarc_report_detail_tables.gql_query import query_string

# For demo purposes only
from tests.testdata.dmarc_report_detail_table import (
    dmarc_report_detail_table_return_data,
)


@require_token
def resolve_dmarc_report_detail_tables(self, info, **kwargs):
    """
    This function is used to resolve the DmarcReportDetailTables graphql object
    which contains a list of details for creating the detail table table.
    :param self: None
    :param info: Request information sent to the sever from a client
    :param kwargs: Field arguments (i.e. organization), and user_roles
    :return: DmarcReportDetailTables Object
    """
    user_id = kwargs.get("user_id")
    user_roles = kwargs.get("user_roles")
    domain_slug = cleanse_input(kwargs.get("domain_slug"))
    period = cleanse_input(kwargs.get("period"))
    year = cleanse_input(kwargs.get("year"))

    # Grab domain
    domain_orm = db_session.query(Domains).filter(Domains.slug == domain_slug).first()

    # Check if domain exists
    if domain_orm is not None:
        # Check if user has access
        if is_user_read(user_roles=user_roles, org_id=domain_orm.organization_id):
            # Get domain
            domain = domain_orm.domain

            # Create start and end date values
            if period == PeriodEnums.LAST30DAYS:
                thirty_days = True
                start_date, end_date = generate_start_end_date(
                    current_date=datetime.utcnow(),
                    past_date=datetime.utcnow() + timedelta(days=-30),
                )
            else:
                thirty_days = False
                month_num = list(calendar.month_abbr).index(period)
                if month_num < 10:
                    month_string = f"0{month_num}"
                else:
                    month_string = month_num
                start_date = f"{year}-{month_string}-01"
                end_date = f"{year}-{month_string}-32"

            # Create variable dict for request
            variables = {
                "domain": domain,
                "startDate": start_date,
                "endDate": end_date,
                "thirtyDays": thirty_days,
            }

            # Send request
            data = send_request(query=query_string, variables=variables,)

            data = data.get("getDmarcSummaryByPeriod").get("period")

            logger.info(
                f"User: {user_id} successfully retrieved the DmarcDetailTables for: {domain_slug}."
            )
            return DmarcReportDetailTables(
                # Get Month Name
                calendar.month_name[int(data.get("endDate")[5:7].lstrip("0"))],
                # Get Year
                data.get("endDate")[0:4].lstrip("0"),
                # Get Category Data
                data.get("detailTables"),
            )

        else:
            logger.warning(
                f"User: {user_id} tried to retrieved the DmarcDetailTables for: {domain_slug} but does not have access to {domain_orm.organization.slug}."
            )
            raise GraphQLError("Error, dmarc detail tables cannot be found.")
    else:
        logger.warning(
            f"User: {user_id} tried to retrieved the DmarcDetailTables for: {domain_slug} but domain does not exist."
        )
        raise GraphQLError("Error, dmarc detail tables cannot be found.")


def resolve_demo_dmarc_report_detail_tables(self, info, **kwargs):
    """
    This function is used to demo resolve the DmarcReportDetailTables graphql
    query which contains a predetermined data set to be returned to the user
    :param self: None
    :param info: Request information sent to the sever from a client
    :param kwargs: Field arguments (i.e. organization), and user_roles
    :return: DmarcReportDetailTables Object
    """
    data = dmarc_report_detail_table_return_data.get("getDmarcSummaryByPeriod").get(
        "period"
    )

    return DmarcReportDetailTables(
        # Get Month Name
        calendar.month_name[int(data.get("endDate")[5:7].lstrip("0"))],
        # Get Year
        data.get("endDate")[0:4].lstrip("0"),
        # Get Category Data
        data.get("detailTables"),
    )
