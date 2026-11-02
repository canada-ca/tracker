"""Enrollment email notifications via GC Notify."""

import json
import logging
import os
from functools import lru_cache

from dotenv import load_dotenv
from notifications_python_client.notifications import NotificationsAPIClient

load_dotenv()

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def _client() -> NotificationsAPIClient:
    return NotificationsAPIClient(
        api_key=os.getenv("NOTIFICATION_API_KEY"),
        base_url=os.getenv("NOTIFICATION_API_URL"),
    )


def send_enrollment_notification(email: str, enrolled_domains: list[str]):
    """Email `email` the list of newly enrolled domains; log and return None on failure."""
    try:
        res = _client().send_email_notification(
            email_address=email,
            template_id=os.getenv("CVD_ENROLLMENT_NOTIFICATION_TEMPLATE_ID"),
            personalisation={"domains": ", ".join(enrolled_domains), "count": len(enrolled_domains)},
        )
        logger.info(f"Email sent to {email} with response: {json.dumps(res, indent=2)}")
        return res
    except Exception as e:
        logger.error(f"Failed to send email notification to {email}: {e}")
