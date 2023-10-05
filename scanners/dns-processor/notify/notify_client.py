import os
from notifications_python_client.notifications import NotificationsAPIClient
from dotenv import load_dotenv

load_dotenv()
notify_client = NotificationsAPIClient(
    api_key=os.getenv("NOTIFICATION_API_KEY"),
    base_url=os.getenv("NOTIFICATION_API_URL"),
)
