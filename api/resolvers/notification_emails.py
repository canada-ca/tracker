import os

from itsdangerous import URLSafeTimedSerializer
from notifications_python_client import NotificationsAPIClient

from functions.email_templates import (
    email_verification_template,
    password_reset_template)
from schemas.notification_email import (
    Content,
    Template,
    NotificationEmail
)

NOTIFICATION_API_KEY = os.getenv('NOTIFICATION_API_KEY')
NOTIFICATION_API_URL = os.getenv('NOTIFICATION_API_URL')

SUPER_SECRET_KEY = os.getenv('SUPER_SECRET_KEY')
SUPER_SECRET_SALT = os.getenv('SUPER_SECRET_SALT')

notifications_client = NotificationsAPIClient(
    NOTIFICATION_API_KEY,
    NOTIFICATION_API_URL,
)


def resolve_send_password_reset(self, info, email):
    template_id = password_reset_template()
    password_reset_serial = URLSafeTimedSerializer(SUPER_SECRET_KEY)

    # TODO: Change to deployment URL
    password_reset_url = "http://localhost:3000/reset-password/" + password_reset_serial.dumps(
        email, salt=SUPER_SECRET_SALT)

    response = notifications_client.send_email_notification(
        email_address=email,
        personalisation={
            'user': email.split('@')[0],  # A pseudo username
            'password_reset_url': password_reset_url
        },
        template_id=template_id
    )

    return populate_notification_email(response)


def resolve_send_validation_email(self, info, email):
    template_id = email_verification_template()

    verify_email_serial = URLSafeTimedSerializer(SUPER_SECRET_KEY)

    # TODO: Change to deployment URL
    verify_email_url = "http://localhost:3000/verify-email/" + verify_email_serial.dumps(
        email, salt=SUPER_SECRET_SALT)

    response = notifications_client.send_email_notification(
        email_address=email,
        personalisation={
            'user': email.split('@')[0],  # A pseudo username
            'verify_email_url': verify_email_url
        },
        template_id=template_id
    )

    return populate_notification_email(response)


def populate_notification_email(response):
    """
    This function populates a NotificationEmail object to be sent to GraphQL
    :param response: The email response dict from notification client
    :return: The populated NotificationEmail object ot be sent to GraphQL
    """
    content = Content(response['content']['body'],
                      response['content']['from_email'],
                      response['content']['subject'])

    id = response['id']

    reference = response['reference']

    scheduled_for = response['scheduled_for']

    template = Template(response['template']['id'],
                        response['template']['uri'],
                        response['template']['version'])

    uri = response['uri']

    return NotificationEmail(content,
                             id,
                             reference,
                             scheduled_for,
                             template,
                             uri)
