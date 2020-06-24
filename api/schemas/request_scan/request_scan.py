import graphene

from graphql import GraphQLError

from app import logger
from db import db_session
from enums.scan_types import ScanTypeEnums
from functions.auth_wrappers import require_token
from functions.auth_functions import is_user_write
from schemas.request_scan.fire_scan import fire_scan
from functions.input_validators import cleanse_input
from models import Domains
from scalars.slug import Slug


class RequestScan(graphene.Mutation):
    """
    This mutation is used to send a domain to the scanners to be scanned
    """

    class Arguments:
        url_slug = Slug(
            description="The domain that you would like the scan to be ran on."
        )
        scan_type = ScanTypeEnums(
            description="Type of scan to perform on designated domain ('Web' or 'Mail')."
        )

    request_status = graphene.String()

    @require_token
    def mutate(self, info, **kwargs):
        """
        Process the request from the user
        :param info: The request from the user
        :param kwargs: Arguments passed in from token and request
        :return: Request Scan object with status of request
        """
        # Get variables from kwargs
        user_id = kwargs.get("user_id")
        user_roles = kwargs.get("user_roles")
        slug = cleanse_input(kwargs.get("url_slug"))
        scan_type = kwargs.get("scan_type")

        # Get Domain ORM related to requested domain
        domain_orm = db_session.query(Domains).filter(Domains.slug == slug).first()

        # Check to make sure domain exists
        if domain_orm is None:
            logger.warning(
                f"User: {user_id} tried to request a scan for {slug} but domain does not exist."
            )
            raise GraphQLError("Error, unable to request scan.")

        # Check to ensure user has admin rights
        org_id = domain_orm.organization_id
        domain_id = domain_orm.id
        url = domain_orm.domain

        # DKIM selector strings corresponding to domain
        selectors = domain_orm.selectors

        if is_user_write(user_roles=user_roles, org_id=org_id):
            # Fire scan and get status from request
            status = fire_scan(
                user_id=user_id,
                domain_id=domain_id,
                url=url,
                scan_type=scan_type,
                selectors=selectors,
            )

            # Return status information to user
            if "Scan successfully dispatched to designated scanners" in status:
                logger.info(
                    f"User: {user_id} successfully dispatched a scan for {slug}."
                )

                return_status = f"Scan successfully dispatched for {slug}"
                return RequestScan(request_status=return_status)
            else:
                logger.warning(
                    f"User: {user_id} attempted to dispatch a scan, but dispatcher returned: {status}"
                )
                raise GraphQLError("Error, unable to request scan.")

        # If user doesn't have rights error out
        else:
            logger.warning(
                f"User: {user_id} tried to dispatch a scan for {slug} but does not have permissions to do so."
            )
            raise GraphQLError("Error, unable to request scan.")
