import os
from notify_client import notify_client
from dotenv import load_dotenv

load_dotenv()


def get_stakeholders(db) -> list:
    """
    Gets the stakeholders for a domain.

    :param db: The database object.
    :return: A list of user objects.
    """

    user_emails = os.getenv("ALERT_SUBS").split(",")
    users = []
    try:
        users = db.users.find({"username": {"$in": user_emails}}).all()
    except Exception as e:
        raise Exception(f"Failed to get users from database with error: {e}")
    return users


def send_mx_diff_email_alerts(domain: str, logger: object, db: object) -> None:
    """
    Sends an email to the user when the MX records for a domain have changed.

    :param domain: The domain that has changed.
    :param mx_records: The new MX records for the domain.
    :param mx_records_old: The old MX records for the domain.
    :param email: The email address to send the email to.
    """

    stakeholders = get_stakeholders(db)
    for user in stakeholders:
        email = user.get("username")
        try:
            response = notify_client.send_email_notification(
                email_address=email,
                template_id=os.getenv("NOTIFICATION_ASSET_CHANGE_ALERT_EMAIL"),
                personalisation={
                    "domain": domain,
                    "display_name": user.get("displayName"),
                },
            )
            logger.info(f"Email sent to {email} with response: {response}")
        except Exception as e:
            logger.error(f"Failed to send email to {email} with error: {e}")
