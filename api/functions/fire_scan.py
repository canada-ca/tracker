import requests
import jwt
import os
import datetime

from flask import request

from app import app
from db import db

from models import Scans


def fire_scan(user_id: int, domain_id: int, url: str, dkim: bool):
    """
    Functionality to send request to scanners and request a domain to get scanned
    :param user_id: The id of the requesting user
    :param domain_id: The id of the domain
    :param url: URL passed in through the request
    :param dkim: Bool to see if url needs to be put through the dkim scanner
    :return: Status code returned from request
    """
    # Create Scan Object
    new_scan = Scans(
        domain_id=domain_id,
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
        'Data': encoded_payload
    }

    status = requests.post(
        "http://34.67.57.19/receive",
        headers=headers,
        # data=encoded_payload
    )

    return str(status.text)
