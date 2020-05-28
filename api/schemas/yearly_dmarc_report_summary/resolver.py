import os
import calendar
import graphene

from datetime import datetime, timedelta
from graphql import GraphQLError

from db import db_session
from functions.auth_wrappers import require_token
from functions.auth_functions import is_user_write
from functions.input_validators import cleanse_input
from models import Domains
from models.Organizations import Organizations
from schemas.yearly_dmarc_report_summary.category_totals import CategoryTotals
from schemas.yearly_dmarc_report_summary.send_request import send_request
from schemas.yearly_dmarc_report_summary.yearly_dmarc_report_summary import YearlyDmarcReportSummary


DMARC_REPORT_API_URL = os.getenv("DMARC_REPORT_API_URL")
DMARC_REPORT_API_TOKEN = os.getenv("DMARC_REPORT_API_TOKEN")

# @require_token
def resolve_get_yearly_dmarc_report_summary(self, info, **kwargs):
    """

    :param self:
    :param info:
    :param kwargs:
    :return:
    """
    user_id = kwargs.get("user_id")
    user_roles = kwargs.get("user_roles")
    domain = cleanse_input(kwargs.get("domain"))

    # # Get Domains org_id
    # domain_orm = db_session.query(Domains).filter(
    #     domain == domain
    # ).first()
    #
    # if domain_orm is not None:
    #     if is_user_write(user_roles=user_roles, org_id=domain_orm.organization_id):
    #
    #     else:
    #         raise GraphQLError("Error, you do not have access to this domain.")
    # else:
    #     raise GraphQLError("Error, domain cannot be found.")

    start_date = "{last_year}-01-01".format(last_year=(datetime.utcnow() + timedelta(days=-365)).year)
    end_date = "{next_year}-01-01".format(next_year=(datetime.utcnow() + timedelta(days=+365)).year)

    data = send_request(
        api_domain=DMARC_REPORT_API_URL,
        auth_token=DMARC_REPORT_API_TOKEN,
        request_domain=domain,
        start_date=start_date,
        end_date=end_date
    )

    rtr_list = []

    # print(data.get("getTotalDmarcSummaries").get("periods"))
    iter_data = iter(data.get("getTotalDmarcSummaries").get("periods"))
    next(iter_data)

    for data in iter_data:
        rtr_list.append(
            YearlyDmarcReportSummary(
                calendar.month_name[int(data.get("startDate")[5:7].lstrip("0"))],
                data.get("startDate")[0:4].lstrip("0"),
                data.get("categoryTotals")
            )
        )
    return rtr_list
