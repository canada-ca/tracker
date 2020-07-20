from decimal import Decimal
from random import randint

from graphql import GraphQLError

from app import logger
from db import db_session
from functions.auth_functions import is_user_read
from functions.auth_wrappers import require_token
from models import Summaries, Organizations
from schemas.shared_structures.categorized_summary import (
    CategorizedSummary,
    SummaryCategory,
)


@require_token
def resolve_email_summary(self, info, **kwargs):
    """
    This function is used to resolve the emailSummary query. It does this by querying
    the database for the latest summary data.
    :param self: None
    :param info: Request information
    :param kwargs: Various arguments passed in
    :return: CatagorizedSummary object with data
    """
    user_id = kwargs.get("user_id")
    user_roles = kwargs.get("user_roles")

    # Generate user Org ID list
    org_ids = []
    for role in user_roles:
        org_ids.append(role["org_id"])

    # Set user read check
    user_read = False

    # Check to see if user belongs to at least one org
    for org_id in org_ids:
        if is_user_read(user_roles=user_roles, org_id=org_id):
            user_read = True

    if user_read is True:
        # Grab latest three email results
        summaries = (
            db_session.query(Summaries)
            .filter(Summaries.type == "email")
            .order_by(Summaries.id.desc())
            .limit(3)
            .all()
        )

        # Check to ensure that there is data returned from the db
        if not summaries:
            logger.warning(
                f"User: {user_id} tried to access email summary query but no email summaries could be found."
            )
            raise GraphQLError("Error, email summary could not be found.")

        # Generate return data
        total = 0
        summary_catagories = []

        # Loop through each summary returned by the db
        for summary in summaries:
            # Create list of SummaryCategory objects for the categories field
            # In the CategorizedSummary Object
            summary_catagories.append(
                SummaryCategory(
                    name=summary.name,
                    count=summary.count,
                    percentage=summary.percentage,
                )
            )
            # Calculate total domains that were retrieved
            total += summary.count

        # Create CategorizedSummary Object to return
        rtr_data = CategorizedSummary(categories=summary_catagories, total=total,)

        logger.info(
            f"User: {user_id} successfully retrieved email summary information."
        )
        return rtr_data

    else:
        logger.warning(
            f"User: {user_id} tried to access email summary query but does not have any user read or higher access."
        )
        raise GraphQLError("Error, email summary could not be found.")


def resolve_demo_email_summary(self, info, **kwargs):
    """
    This function is used to resolve the demoEmailSummary query. It does this by
    generating random data for demo purposes
    :param self: None
    :param info: Request information
    :param kwargs: Various arguments passed in
    :return: CatagorizedSummary object with data
    """
    summaries = generate_demo_data()

    # Generate return data
    total = 0
    summary_catagories = []

    for summary in summaries:
        summary_catagories.append(
            SummaryCategory(
                name=summary.get("name"),
                count=summary.get("count"),
                percentage=summary.get("percentage"),
            )
        )
        total += summary.get("count")

    rtr_data = CategorizedSummary(categories=summary_catagories, total=total,)

    return rtr_data


def generate_demo_data(
    full_pass_count=None, full_fail_count=None, partial_pass_count=None
):
    if not full_pass_count:
        full_pass_count = randint(100, 10000)

    if not full_fail_count:
        full_fail_count = randint(100, 10000)

    if not partial_pass_count:
        partial_pass_count = randint(100, 10000)

    full_pass_percentage = round(
        Decimal(
            (full_pass_count / (full_pass_count + full_fail_count + partial_pass_count))
            * 100
        ),
        1,
    )
    full_fail_percentage = round(
        Decimal(
            (full_fail_count / (full_pass_count + full_fail_count + partial_pass_count))
            * 100
        ),
        1,
    )
    partial_pass_percentage = round(
        Decimal(
            (
                partial_pass_count
                / (full_pass_count + full_fail_count + partial_pass_count)
            )
            * 100
        ),
        1,
    )

    summaries = [
        {
            "name": "full-pass",
            "count": full_pass_count,
            "percentage": full_pass_percentage,
        },
        {
            "name": "full-fail",
            "count": full_fail_count,
            "percentage": full_fail_percentage,
        },
        {
            "name": "partial-pass",
            "count": partial_pass_count,
            "percentage": partial_pass_percentage,
        },
    ]

    return summaries
