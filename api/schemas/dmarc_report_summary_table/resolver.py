import os
import calendar

from datetime import datetime, timedelta
from gql import gql
from graphql import GraphQLError

from app import logger
from db import db_session
from enums.period import PeriodEnums
from functions.auth_wrappers import require_token
from functions.auth_functions import is_super_admin
from functions.external_graphql_api_request import send_request
from functions.input_validators import cleanse_input
from functions.start_end_date_generation import generate_start_end_date
from models import Domains, Organizations, User_affiliations, Users
from schemas.dmarc_report_summary_table.dmarc_report_summary_table import (
    DmarcReportSummaryTable,
)
from tests.testdata.dmarc_report_summary_table import (
    api_return_data_1,
    api_return_data_2,
)


@require_token
def resolve_dmarc_report_summary_table(self, info, **kwargs):
    user_id = kwargs.get("user_id")
    user_roles = kwargs.get("user_roles")
    period = cleanse_input(kwargs.get("period"))
    year = cleanse_input(kwargs.get("year"))

    data_list = []

    if is_super_admin(user_roles=user_roles):
        domains = db_session.query(Domains).all()
    else:
        domains = []
        for role in user_roles:
            org_domains = (
                db_session.query(Domains)
                .filter(Domains.organization_id == role["org_id"])
                .all()
            )
            for domain in org_domains:
                domains.append(domain)

    if domains:
        for domain in domains:
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
                "domain": domain.domain,
                "startDate": start_date,
                "endDate": end_date,
                "thirtyDays": thirty_days,
            }

            # dmarc-report-api query
            query = gql(
                """
                query (
                    $domain:GCURL!
                    $startDate:CustomDate!
                    $endDate:CustomDate!
                    $thirtyDays:Boolean
                ) {
                    getDmarcSummaryByPeriod (
                        domain: $domain
                        startDate: $startDate
                        endDate: $endDate
                        thirtyDays: $thirtyDays
                    ) {
                        period {
                            categoryTotals {
                                fullPass
                                passSpfOnly
                                passDkimOnly
                                fail
                            }
                        }
                    }
                }
                """
            )

            # Send request
            data = send_request(query=query, variables=variables, summary_table=True,)
            temp_dict = data.get("getDmarcSummaryByPeriod", {}).get("period", {})
            temp_dict.update({"domain": domain.domain})
            data_list.append(temp_dict)

    else:
        logger.warn(
            f"User: {user_id} tried to select DmarcReportSummaryTable information for all their domains, however they have no associated domains."
        )
        raise GraphQLError(
            "Error, dmarc report summary table information cannot be found."
        )

    logger.info(
        f"User: {user_id} successfully retrieved the DmarcReportSummaryTable information for all their domains."
    )

    return DmarcReportSummaryTable(
        # Get Month Name
        datetime.strptime(period.lower(),'%b').strftime('%B'),
        # Get Year
        year,
        data_list,
    )


def resolve_demo_dmarc_report_summary_table(self, info, **kwargs):
    data_list = []
    faked_data = [
        {"domain": "test.gc.ca", "data": api_return_data_1},
        {"domain": "test.canada.ca", "data": api_return_data_2},
    ]

    for data in faked_data:
        temp_dict = (
            data.get("data", {}).get("getDmarcSummaryByPeriod", {}).get("period", {})
        )
        temp_dict.update({"domain": data.get("domain")})
        data_list.append(temp_dict)

    return DmarcReportSummaryTable(
         # Get Month Name
        datetime.strptime(period.lower(),'%b').strftime('%B'),
        # Get Year
        year,
        data_list,
    )
