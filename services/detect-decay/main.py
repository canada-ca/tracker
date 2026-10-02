import logging
import os
import sys

from arango import ArangoClient
from dotenv import load_dotenv
from notifications_python_client.notifications import NotificationsAPIClient

from config import Config
from detect_decay import detect_decay

logging.basicConfig(stream=sys.stdout, level=logging.INFO)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    load_dotenv()

    DB_USER = os.getenv("DB_USER")
    DB_PASS = os.getenv("DB_PASS")
    DB_NAME = os.getenv("DB_NAME")
    DB_URL = os.getenv("DB_URL")

    START_HOUR = os.getenv("DETECT_DECAY_START_HOUR")
    START_MINUTE = os.getenv("DETECT_DECAY_START_MINUTE")
    MINIMUM_SCANS = os.getenv("DETECT_DECAY_MINIMUM_SCANS")
    DRY_RUN_EMAIL_MODE = os.getenv("DETECT_DECAY_DRY_RUN_EMAIL_MODE", "false") == "true"
    DRY_RUN_LOG_MODE = os.getenv("DETECT_DECAY_DRY_RUN_LOG_MODE", "false") == "true"
    SERVICE_ACCOUNT_EMAIL = os.getenv("SERVICE_ACCOUNT_EMAIL")
    EMAIL_TEMPLATE_ID = os.getenv("DETECT_DECAY_EMAIL_TEMPLATE_ID")

    NOTIFICATION_API_KEY = os.getenv("NOTIFICATION_API_KEY")
    NOTIFICATION_API_URL = os.getenv("NOTIFICATION_API_URL")

    missing_envs = [
        key
        for key, val in {
            "DB_USER": DB_USER,
            "DB_PASS": DB_PASS,
            "DB_NAME": DB_NAME,
            "DB_URL": DB_URL,
            "DETECT_DECAY_START_HOUR": START_HOUR,
            "DETECT_DECAY_START_MINUTE": START_MINUTE,
            "DETECT_DECAY_MINIMUM_SCANS": MINIMUM_SCANS,
        }.items()
        if not val
    ]
    if missing_envs:
        logger.error(f"Missing required environment variables: {', '.join(missing_envs)}")
        sys.exit(1)

    if DRY_RUN_EMAIL_MODE and DRY_RUN_LOG_MODE:
        logger.error("Both Dry Run Email mode and Dry Run Log mode cannot be enabled at the same time. Please check your environment variables.")
        sys.exit(1)
    elif DRY_RUN_EMAIL_MODE:
        logger.info("Dry Run Email mode is enabled - emails will only be sent to the tracker service account email")
    elif DRY_RUN_LOG_MODE:
        logger.info("Dry Run Log mode is enabled - no emails will be sent")
    else:
        logger.info("Dry Run modes are disabled - emails will be sent to org owners/admins")

    config = Config(
        start_hour=int(START_HOUR),
        start_minute=int(START_MINUTE),
        minimum_scans=int(MINIMUM_SCANS),
        dry_run_email_mode=DRY_RUN_EMAIL_MODE,
        dry_run_log_mode=DRY_RUN_LOG_MODE,
        service_account_email=SERVICE_ACCOUNT_EMAIL,
        email_template_id=EMAIL_TEMPLATE_ID,
    )

    logger.info("Detect decay service started")
    client = ArangoClient(hosts=DB_URL)
    db = client.db(DB_NAME, username=DB_USER, password=DB_PASS)
    notify_client = NotificationsAPIClient(
        api_key=NOTIFICATION_API_KEY,
        base_url=NOTIFICATION_API_URL,
    )
    detect_decay(db, config, notify_client)
    logger.info("Detect decay service shutting down...")
