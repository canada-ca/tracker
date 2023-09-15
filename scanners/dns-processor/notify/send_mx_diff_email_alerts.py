import os
from notify_client import notify_client
from dotenv import load_dotenv

load_dotenv()


def get_stakeholders(domain: str) -> list:
    """
    Gets the stakeholders for a domain.

    :param domain: The domain to get the stakeholders for.
    :return: A list of email addresses.
    """
    return []


def send_mx_diff_email_alerts(
    domain: str, mx_records: list, mx_records_old: list, logger: object
) -> None:
    """
    Sends an email to the user when the MX records for a domain have changed.

    :param domain: The domain that has changed.
    :param mx_records: The new MX records for the domain.
    :param mx_records_old: The old MX records for the domain.
    :param email: The email address to send the email to.
    """

    # Build the message to send.
    message = f"""
    The MX records for {domain} have changed.

    Old MX records:
    {mx_records_old}

    New MX records:
    {mx_records}
    """

    stakeholders = get_stakeholders(domain)

    for user in stakeholders:
        email = user.get("username")
        try:
            response = notify_client.send_email_notification(
                email_address=email,
                template_id=os.getenv("NOTIFICATION_ASSET_CHANGE_ALERT_EMAIL"),
                personalisation={"message": message},
            )
            logger.info(f"Email sent to {email} with response: {response}")
        except Exception as e:
            logger.error(f"Failed to send email to {email} with error: {e}")
