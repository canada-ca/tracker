import os

from arango.database import StandardDatabase

from notify.notify_client import notify_client
from dotenv import load_dotenv

load_dotenv()


def get_stakeholders(db: StandardDatabase):
    """
    Gets the stakeholders for a domain.

    :param db: The database object.
    :return: A list of user objects.
    """

    user_emails = os.getenv("ALERT_SUBS").split(",")

    try:
        users_cursor = db.aql.execute(
            """
            FOR user IN users
                FILTER @user_emails[? ANY FILTER LOWER(CURRENT) == LOWER(user.userName)]
                RETURN user
            """,
            bind_vars={"user_emails": user_emails},
        )
        users = [user for user in users_cursor]
    except Exception as e:
        raise Exception(f"Failed to get users from database with error: {e}")

    return users


def get_reason_str(reason):
    """
    Gets the reason for the change as a string.

    :param reason: The reason for the change.
    :return: A string representing the reason for the change.
    """

    if reason == "host_added":
        return {
            "en": "a new hostname was added",
            "fr": "un nouveau nom d'hôte a été ajouté",
        }
    elif reason == "host_removed":
        return {
            "en": "a hostname was removed",
            "fr": "un nom d'hôte a été supprimé",
        }
    elif reason == "host_changed":
        return {"en": "a hostname was changed", "fr": "un nom d'hôte a été modifié"}
    elif reason == "preference_changed":
        return {
            "en": "a host's preference was changed",
            "fr": "la préférence d'un hôte a été modifiée",
        }
    elif reason == "address_changed":
        return {
            "en": "a host's address was changed",
            "fr": "l'adresse d'un hôte a été modifiée",
        }
    else:
        return {"en": "unknown", "fr": "inconnue"}


def send_mx_diff_email_alerts(domain, diff_reason, logger, db):
    """
    Sends an email to the user when the MX records for a domain have changed.

    :param domain: The domain that has changed.
    :param diff_reason: The reason for the change.
    :param logger: The logger object.
    :param db: The database object.
    """

    stakeholders = get_stakeholders(db)
    for user in stakeholders:
        email = user.get("userName")
        reason = get_reason_str(reason=diff_reason)
        try:
            response = notify_client.send_email_notification(
                email_address=email,
                template_id=os.getenv("NOTIFICATION_ASSET_CHANGE_ALERT_EMAIL"),
                personalisation={
                    "domain": domain,
                    "display_name": user.get("displayName"),
                    "reasonEN": reason.get("en"),
                    "reasonFR": reason.get("fr"),
                },
            )
            logger.info(f"Email sent to {email} with response: {response}")
        except Exception as e:
            logger.error(f"Failed to send email to {email} with error: {e}")
