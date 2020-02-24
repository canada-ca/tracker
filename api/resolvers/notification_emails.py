import os

from flask import url_for
from itsdangerous import URLSafeTimedSerializer
from notifications_python_client import NotificationsAPIClient

NOTIFICATION_API_KEY = os.getenv('NOTIFICATION_API_KEY')
NOTIFICATION_API_URL = os.getenv('NOTIFICATION_API_URL')

SUPER_SECRET_KEY = os.getenv('SUPER_SECRET_KEY')
SUPER_SECRET_SALT = os.getenv('SUPER_SECRET_SALT')

notifications_client = NotificationsAPIClient(
    NOTIFICATION_API_KEY,
    NOTIFICATION_API_URL,
)


def resolve_send_password_reset(self, info, email):
    template_id = '8c3d96cc-3cbe-4043-b157-4f4a2bbb57b1'
    password_reset_serial = URLSafeTimedSerializer(SUPER_SECRET_KEY)
    password_reset_url = "TODO: Send to front end"
    # password_reset_url = url_for('_new_password',
    #                              token=password_reset_serial.dumps(
    #                                  email, salt=SUPER_SECRET_SALT),
    #                              _external=True
    #                              )

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
    template_id = 'TODO: Create template in notification admin'
    password_reset_serial = URLSafeTimedSerializer(SUPER_SECRET_KEY)
    password_reset_url = "TODO: Send to front end"
    # password_reset_url = url_for('_new_password',
    #                              token=password_reset_serial.dumps(
    #                                  email, salt=SUPER_SECRET_SALT),
    #                              _external=True
    #                              )

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


