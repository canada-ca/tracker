import os
from dotenv import load_dotenv
load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
DB_URL = os.getenv("DB_URL")
START_HOUR = int(os.getenv("DETECT_DECAY_START_HOUR"))  
START_MINUTE = int(os.getenv("DETECT_DECAY_START_MINUTE"))
DRY_RUN_EMAIL_MODE = os.getenv("DETECT_DECAY_DRY_RUN_EMAIL_MODE", "false") == "true"
DRY_RUN_LOG_MODE = os.getenv("DETECT_DECAY_DRY_RUN_LOG_MODE", "false") == "true"
SERVICE_ACCOUNT_EMAIL = os.getenv("SERVICE_ACCOUNT_EMAIL")
EMAIL_TEMPLATE_ID = os.getenv("DETECT_DECAY_EMAIL_TEMPLATE_ID")