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
from schemas.dmarc_report_bar_graph.dmarc_report_bar_graph import DmarcReportBarGraph


DMARC_REPORT_API_URL = os.getenv("DMARC_REPORT_API_URL")
DMARC_REPORT_API_TOKEN = os.getenv("DMARC_REPORT_API_TOKEN")


@require_token
def resolve_get_dmarc_report_bar_graph(self, info, **kwargs):
    """
    This function is used to resolve the getDmarcReportBarGraph query
    :param self: A graphql field object
    :param info: Request information
    :param kwargs: Various Arguments passed in
    :return: Returns a list of DmarcReportBarGraph's
    """
    user_roles = kwargs.get("user_roles")
    domain_slug = cleanse_input(kwargs.get("domain_slug"))

    # Get Domain ORM
    domain_orm = db_session.query(Domains).filter(Domains.slug == domain_slug).first()

    # Check to see if domain exists
    if domain_orm is not None:
        if is_user_read(user_roles=user_roles, org_id=domain_orm.organization_id):
            # Get Domain
            domain = domain_orm.domain

            # Create Start and End Dates
            past_date = datetime.utcnow() + timedelta(days=-365)
            future_date = datetime.utcnow() + timedelta(days=365)
            start_date = f"{past_date.year}-01-01"
            end_date = f"{future_date.year}-12-31"

            # Create GQL variables
            variables = {"domain": domain, "startDate": start_date, "endDate": end_date}

            # Dmarc Report API query
            query = gql(
                """
                query (
                    $domain:GCURL!
                    $startDate:CustomDate!
                    $endDate:CustomDate!
                ) {
                    getTotalDmarcSummaries(
                        domain: $domain
                        startDate: $startDate
                        endDate: $endDate
                    ) {
                        periods {
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

            rtr_list = []

            # Skip first entry from return data because it is past 30 days which
            # for this query we do not want
            iter_data = iter(data.get("getTotalDmarcSummaries").get("periods"))
            next(iter_data)

            # Loop through 13 months of data, and create return list
            for data in iter_data:
                rtr_list.append(
                    DmarcReportBarGraph(
                        # Get Month Name
                        calendar.month_name[
                            int(data.get("startDate")[5:7].lstrip("0"))
                        ],
                        # Get Year
                        data.get("startDate")[0:4].lstrip("0"),
                        # Get Category Data
                        data.get("categoryTotals"),
                    )
                )
            return rtr_list

        else:
            raise GraphQLError("Error, you do not have access to this domain.")
    else:
        raise GraphQLError("Error, domain cannot be found.")
