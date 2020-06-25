import datetime
import requests

from typing import List
from graphql import GraphQLError

from app import logger
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

    # Create Scan Object
    if scan_type == "mail":
        new_scan = Mail_scans(
            domain_id=domain_id,
            scan_date=scan_datetime,
            selectors=selectors,
            initiated_by=user_id,
        )
        db_session.add(new_scan)
    elif scan_type == "web":
        new_scan = Web_scans(
            domain_id=domain_id, scan_date=scan_datetime, initiated_by=user_id
        )
        db_session.add(new_scan)
    else:
        logger.warning(
            f"User: {user_id} attempted to request a scan with an invalid type."
        )
        raise GraphQLError("Error, unable to request scan.")

    # Update Domain Tables Last Run
    Domains.query.filter(Domains.id == domain_id).update({"last_run": scan_datetime})

    db_session.commit()

    # Get latest scan entry
    if scan_type == "mail":
        scan_orm = db_session.query(Mail_scans).order_by(Mail_scans.id.desc()).first()
        scan_id = scan_orm.id
    elif scan_type == "web":
        scan_orm = db_session.query(Web_scans).order_by(Web_scans.id.desc()).first()
        scan_id = scan_orm.id

    payload = {
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

    try:
        status = requests.post(DISPATCHER_URL + "/receive", headers=headers)
    except Exception as e:
        # If scan fails delete latest scan entry to keep db clear of scans with no data
        try:
            if scan_type == "mail":
                db_session.query(Mail_scans).filter(
                    Mail_scans.id == scan_orm.id
                ).delete()
            elif scan_type == "web":
                db_session.query(Web_scans).filter(Web_scans.id == scan_orm.id).delete()
            db_session.commit()

        except Exception as se:
            logger.error(
                f"User: {user_id} an error occurred while scan was being deleted from database: {str(se)}"
            )
            raise GraphQLError("Error, unable to request scan.")

        logger.error(
            f"User: {user_id} attempted to request a scan but an error arouse with the dispatcher: {str(e)}"
        )
        raise GraphQLError("Error, unable to request scan.")

    return str(status.text)
