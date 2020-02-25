import os

from flask import url_for
from itsdangerous import URLSafeTimedSerializer
from notifications_python_client import NotificationsAPIClient

from functions.email_templates import (
    email_verification_template,
    password_reset_template)

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
    # TODO: Add the proper URL not just token
    password_reset_url = password_reset_serial.dumps(
                                      email, salt=SUPER_SECRET_SALT)

    response = notifications_client.send_email_notification(
        email_address=email,
        personalisation={
            'user': email,
            'password_reset_url': password_reset_url
        },
        template_id=template_id
    )
    if response is not None:
        return True
    else:
        return False


def resolve_send_validation_email(self, info, email):
    template_id = email_verification_template()

    verify_email_serial = URLSafeTimedSerializer(SUPER_SECRET_KEY)
    # TODO: Add the proper URL not just token
    verify_email_url = verify_email_serial.dumps(
        email, salt=SUPER_SECRET_SALT)

    response = notifications_client.send_email_notification(
        email_address=email,
        personalisation={
            'user': email,
            'verify_email_url': verify_email_url
        },
        template_id=template_id
    )
    if response is not None:
        return True
    else:
        return False


