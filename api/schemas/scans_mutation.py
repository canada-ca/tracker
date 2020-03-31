import graphene

from graphql import GraphQLError

from app import app
from db import db

from functions.auth_wrappers import require_token
from functions.auth_functions import is_admin
from functions.fire_scan import fire_scan
from functions.input_validators import cleanse_input

from models import Domains

from scalars.url import URL


class RequestScan(graphene.Mutation):
    """
    This mutation is used to send a domain to the scanners to be scanned
    """
    class Arguments:
        url = URL(
            description="The domain that you would like the scan to be ran on."
        )
        dkim = graphene.Boolean(
            description="If this is a DKIM scan please set to true."
        )
        test = graphene.Boolean(
            description="If this scan if for testing purposes set to true."
        )

    status = graphene.String()

    with app.app_context():
        @require_token
        def mutate(self, info, **kwargs):
            """
            Process the request from the user
            :param info: The request from the user
            :param kwargs: Arguments passed in from token and request
            :return: Request Scan object with status of request
            """
            # Get variables from kwargs
            user_id = kwargs.get('user_id')
            user_roles = kwargs.get('user_roles')
            url = cleanse_input(kwargs.get('url'))
            dkim = kwargs.get('dkim')
            test = kwargs.get('test', False)

            # Get Domain ORM related to requested domain
            domain_orm = db.session.query(Domains).filter(
                Domains.domain == url
            ).first()

            # Check to make sure domain exists
            if domain_orm is None:
                raise GraphQLError("Error, domain does not exist")

            # Check to ensure user has admin rights
            org_id = domain_orm.organization_id
            domain_id = domain_orm.id
            if is_admin(user_role=user_roles, org_id=org_id):
                # Fire scan and get status from request
                status = fire_scan(
                    user_id=user_id,
                    domain_id=domain_id,
                    url=url,
                    dkim=dkim,
                    test=test
                )

                # Return status information to user
                return RequestScan(status=status)

            # If user doesn't have rights error out
            else:
                raise GraphQLError(
                    "Error, you do not have permission to request a scan on "
                    "that domain"
                )
