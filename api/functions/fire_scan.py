import os
import datetime

import requests
import jwt
from typing import List

from enums.scan_types import ScanTypeEnums
from db import db_session
from models import Web_scans, Mail_scans, Domains

DISPATCHER_URL = "http://dispatcher.tracker.svc.cluster.local"


def fire_scan(
    user_id: int, domain_id: int, url: str, scan_type: str, selectors: List[str]
):
    """
    Functionality to send request to scanners and request a domain to get scanned
    :param user_id: The id of the requesting user
    :param domain_id: The id of the domain
    :param url: URL passed in through the request
    :param scan_type: Type of scan to be performed ("Web" || "Mail")
    :param selectors: (Optional) List of DKIM selector strings
    :return: Status code returned from request
    """
    # Get Time
    scan_datetime = datetime.datetime.utcnow()

    try:
        scan_type = ScanTypeEnums.get(scan_type)
    except ValueError:
        return "Error: Invalid scan type provided"

    # Create Scan Object
    if scan_type == "mail":
        new_scan = Mail_scans(
            domain_id=domain_id,
            scan_date=scan_datetime,
            selectors=selectors,
            initiated_by=user_id,
        )
        db_session.add(new_scan)
    else:
        new_scan = Web_scans(
            domain_id=domain_id, scan_date=scan_datetime, initiated_by=user_id
        )
        db_session.add(new_scan)

    # Update Domain Tables Last Run
    Domains.query.filter(Domains.id == domain_id).update({"last_run": scan_datetime})

    db_session.commit()

    # Get latest scan entry
    if scan_type == "mail":
        scan_orm = db_session.query(Mail_scans).order_by(Mail_scans.id.desc()).first()
        scan_id = scan_orm.id
    else:
        scan_orm = db_session.query(Web_scans).order_by(Web_scans.id.desc()).first()
        scan_id = scan_orm.id

    payload = {
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=0, seconds=10),
        "scan_id": scan_id,
        "domain": url,
        "selectors": selectors,
        "user_init": True,
    }

    headers = {
        "Content-Type": "application/json",
        "Data": str(payload),
        "Scan-Type": scan_type,
    }

    status = requests.post(DISPATCHER_URL + "/receive", headers=headers)

    return str(status.text)
