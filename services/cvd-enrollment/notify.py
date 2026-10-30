import json
import logging
import os

from dotenv import load_dotenv
from notifications_python_client.notifications import NotificationsAPIClient

load_dotenv()
client = NotificationsAPIClient(
    api_key=os.getenv("NOTIFICATION_API_KEY"),
    base_url=os.getenv("NOTIFICATION_API_URL"),
)

EMAIL_TEMPLATE_ID = os.getenv("CVD_ENROLLMENT_NOTIFICATION_TEMPLATE_ID")

logger = logging.getLogger(__name__)


def send_enrollment_notification(email: str, enrolled_domains: list[str]):
    sep = ", "
    enrolled_domains_str = sep.join(enrolled_domains)
    count = len(enrolled_domains)

    try:
        res = client.send_email_notification(
            email_address=email,
            template_id=EMAIL_TEMPLATE_ID,
            personalisation={"domains": enrolled_domains_str, "count": count},
        )
        logger.info(f"Email sent to {email} with response: {json.dumps(res, indent=2)}")
        return res
    except Exception as e:
        logger.error(f"Failed to send email notification to {email}: {e}")
