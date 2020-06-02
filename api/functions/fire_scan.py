import os
import datetime

import requests
import jwt

from db import db_session
from models import Scans, Domains

DISPATCHER_URL = "http://dispatcher.tracker.svc.cluster.local"


def fire_scan(user_id: int, domain_id: int, url: str, dkim: bool):
    """
    Functionality to send request to scanners and request a domain to get scanned
    :param user_id: The id of the requesting user
    :param domain_id: The id of the domain
    :param url: URL passed in through the request
    :param dkim: Bool to see if url needs to be put through the dkim scanner
    :param test: Bool to send for testing purposes
    :return: Status code returned from request
    """
    # Get Time
    scan_datetime = datetime.datetime.utcnow()

    # Create Scan Object
    new_scan = Scans(domain_id=domain_id, scan_date=scan_datetime, initiated_by=user_id)
    db_session.add(new_scan)

    # Update Domain Tables Last Run
    Domains.query.filter(Domains.id == domain_id).update({"last_run": scan_datetime})

    db_session.commit()

    # Get latest scan entry
    scan_orm = db_session.query(Scans).order_by(Scans.id.desc()).first()
    scan_id = scan_orm.id

    payload = {
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=0, seconds=10),
        "scan_id": scan_id,
        "domain": url,
        "user_init": True,
    }

    if dkim is True:
        scan_type = "mail"
    else:
        scan_type = "web"

    headers = {
        "Content-Type": "application/json",
        "Data": payload,
        "Scan-Type": scan_type,
    }

    status = requests.post(DISPATCHER_URL + "/receive", headers=headers, data=payload)

    return str(status.text)
