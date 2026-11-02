"""Enrollment email notifications via GC Notify."""

import json
import logging
from dataclasses import dataclass

from notifications_python_client.notifications import NotificationsAPIClient

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class NotifySettings:
    """GC Notify connection settings; any value may be None when unset in the environment.

    Missing values make sending fail, which `send_enrollment_notification` logs.
    """

    api_key: str | None
    base_url: str | None
    template_id: str | None


def send_enrollment_notification(
    settings: NotifySettings, email: str, enrolled_domains: list[str]
):
    """Email `email` the list of newly enrolled domains; log and return None on failure."""
    try:
        client = NotificationsAPIClient(api_key=settings.api_key, base_url=settings.base_url)
        res = client.send_email_notification(
            email_address=email,
            template_id=settings.template_id,
            personalisation={"domains": ", ".join(enrolled_domains), "count": len(enrolled_domains)},
        )
        logger.info(f"Email sent to {email} with response: {json.dumps(res, indent=2)}")
        return res
    except Exception as e:
        logger.error(f"Failed to send email notification to {email}: {e}")
