import datetime
import graphene
import requests
import jwt
import os

from flask import request
from graphql import GraphQLError

from app import app
from db import db

from functions.auth_wrappers import require_token
from functions.auth_functions import is_admin

from models import Domains, Scans

from scalars.url import URL


def fire_scan(user_id: int, url: str, dkim: bool):
    """
    Functionality to send request to scanners and request a domain to get scanned
    :param user_id: The id of the requesting user
    :param url: URL passed in through the request
    :param dkim: Bool to see if url needs to be put through the dkim scanner
    :return: Status code returned from request
    """
    # Create Scan Object
    new_scan = Scans(
        scan_date=datetime.datetime.utcnow(),
        initiated_by=user_id
    )
    db.session.add(new_scan)
    db.session.commit()

    # Get latest scan entry
    scan_orm = db.session.query(Scans).order_by(
        Scans.id.desc()
    ).first()
    scan_id = scan_orm.id

    payload = {
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=0,seconds=60),
        "scan_id": scan_id,
        "domain": url,
        "dkim": dkim,
        "user_init": True
    }

    # TODO Replace secret
    encoded_payload = jwt.encode(
        payload,
        'test_jwt',
        algorithm='HS256'
    ).decode('utf-8')

    headers = {
        'Content-Type': 'application/json',
        'Host': 'dispatcher.tracker.example.com',
    }

    status = requests.post(
        "http://34.67.57.19/dispatch",
        headers=headers,
        data=encoded_payload
    )

    return status


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
            url = kwargs.get('url')
            dkim = kwargs.get('dkim')

            # Get Domain ORM related to requested domain
            domain_orm = db.session.query(Domains).filter(
                Domains.domain == url
            ).first()

            # Check to make sure domain exists
            if domain_orm is None:
                raise GraphQLError("Error, domain does not exist")

            # Check to ensure user has admin rights
            org_id = domain_orm.organization_id
            if is_admin(user_role=user_roles, org_id=org_id):
                # Fire scan and get status from request
                status = fire_scan(user_id=user_id, url=url, dkim=dkim)

                # Return status information to user
                return RequestScan(status=status)

            # If user doesn't have rights error out
            else:
                raise GraphQLError(
                    "Error, you do not have permission to request a scan on "
                    "that domain"
                )
