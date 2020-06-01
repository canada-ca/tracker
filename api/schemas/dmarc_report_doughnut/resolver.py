import os
import calendar

from datetime import datetime, timedelta
from gql import gql
from graphql import GraphQLError

from db import db_session
from enums.period import PeriodEnums
from functions.auth_wrappers import require_token
from functions.auth_functions import is_user_read
from functions.external_graphql_api_request import send_request
from functions.input_validators import cleanse_input
from models import Domains
from schemas.dmarc_report_doughnut.dmarc_report_doughnut import DmarcReportDoughnut


DMARC_REPORT_API_URL = os.getenv("DMARC_REPORT_API_URL")
DMARC_REPORT_API_TOKEN = os.getenv("DMARC_REPORT_API_TOKEN")


@require_token
def resolve_get_dmarc_report_doughnut(self, info, **kwargs) -> DmarcReportDoughnut:
    """
    This function is used to resolve the get_yearly_dmarc_report_summary query
    :param self: A graphql field object
    :param info: Request information
    :param kwargs: Various Arguments passed in
    :return: Returns a list of YearlyDmarcReportSummary
    """
    user_roles = kwargs.get("user_roles")
    domain_slug = cleanse_input(kwargs.get("domain_slug"))
    period = cleanse_input(kwargs.get("period"))
    year = cleanse_input(kwargs.get("year"))

    # Get Domains org_id
    domain_orm = db_session.query(Domains).filter(Domains.slug == domain_slug).first()

    # Check to see if domain exists
    if domain_orm is not None:
        # Check to see if user can view this domain
        if is_user_read(user_roles=user_roles, org_id=domain_orm.organization_id):
            # Get Domain
            domain = domain_orm.domain

            # Create start and end date values
            if period == PeriodEnums.LAST30DAYS:
                current_date = datetime.utcnow()
                past_date = datetime.utcnow() + timedelta(days=30)
                start_date = (
                    f"{current_date.year}-{current_date.month}-{current_date.day}"
                )
                end_date = f"{past_date.year}-{past_date.month}-{past_date.day}"
            else:
                month_num = list(calendar.month_abbr).index(period)
                if month_num < 10:
                    month_string = f"0{month_num}"
                else:
                    month_string = month_num
                start_date = f"{year}-{month_string}-01"
                end_date = f"{year}-{month_string}-32"

            # Create variable dict for request
            variables = {"domain": domain, "startDate": start_date, "endDate": end_date}

            # dmarc-report-api query
            query = gql(
                """
                query (
                    $domain:GCURL!
                    $startDate:CustomDate!
                    $endDate:CustomDate!
                ) {
                    getDmarcSummaryByPeriod (
                        domain: $domain
                        startDate: $startDate
                        endDate: $endDate
                    ) {
                        period {
                            startDate
                            endDate
                            categoryTotals {
                                dmarcFailNone
                                dmarcFailQuarantine
                                dmarcFailReject
                                spfFailDkimPass
                                spfPassDkimFail
                                spfPassDkimPass
                            }
                        }
                    }
                }
                """
            )

            # Send request
            data = send_request(
                api_domain=DMARC_REPORT_API_URL,
                auth_token=DMARC_REPORT_API_TOKEN,
                query=query,
                variables=variables,
            )

            data = data.get("getDmarcSummaryByPeriod").get("period")
            return DmarcReportDoughnut(
                # Get Month Name
                calendar.month_name[int(data.get("startDate")[5:7].lstrip("0"))],
                # Get Year
                data.get("startDate")[0:4].lstrip("0"),
                # Get Category Data
                data.get("categoryTotals"),
            )
        else:
            raise GraphQLError("Error, you do not have access to this domain.")
    else:
        raise GraphQLError("Error, you do not have access to this domain.")
