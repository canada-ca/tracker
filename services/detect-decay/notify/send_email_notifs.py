import logging
import os
import sys
import json
from notify.notify_client import notify_client
from config import DRY_RUN_EMAIL_MODE, DRY_RUN_LOG_MODE

logging.basicConfig(stream=sys.stdout, level=logging.INFO)
logger = logging.getLogger(__name__)

def send_email_notifs(org, domains, org_users):
    org_name_en = org["orgDetails"]["en"]["name"]
    org_name_fr = org["orgDetails"]["fr"]["name"]
    org_acronym_en = org["orgDetails"]["en"]["acronym"]
    org_acronym_fr = org["orgDetails"]["fr"]["acronym"]
    
    def get_link(domain):
        return f"https://tracker.canada.ca/domains/{domain}/web-guidance"

    def custom_format(d):
        lines = []
        for domain, statuses in d.items():
            link = get_link(domain)
            joined = "\n• ".join(f"{s} " for s in statuses)
            lines.append(f'[{domain}]({link}) \n• {joined}')
        return "\n\n".join(lines)
    
    def translate_to_fr(d):
        translated_decays = {}
        translations = {
            "HTTPS Configuration": "Configuration HTTPS",
            "HSTS Implementation": "Mis en œuvre de HSTS",
            "Certificates": "Certificats",
            "Protocols": "Protocoles",
            "Ciphers": "Chiffres",
            "Curves": "Courbes",
        }
        for domain, statuses in d.items():
            translated_statuses = [translations.get(status, status) for status in statuses]
            translated_decays[domain] = translated_statuses
        return translated_decays

    domains_en = custom_format(domains)
    domains_fr = custom_format(translate_to_fr(domains))
    responses = []

    tracker_email = os.getenv("SERVICE_ACCOUNT_EMAIL")

    if DRY_RUN_EMAIL_MODE:
        email = tracker_email
        try:
            response = notify_client.send_email_notification(
                email_address=email,
                template_id=os.getenv("DETECT_DECAY_EMAIL_TEMPLATE_ID"),
                personalisation={
                    "org_name_en": org_name_en,
                    "org_name_fr": org_name_fr,
                    "org_acronym_en": org_acronym_en,
                    "org_acronym_fr": org_acronym_fr,
                    "domains_en": domains_en,
                    "domains_fr": domains_fr,
                },
            )           
            logger.info(f"Email sent to {email} in {org_name_en} with response: {json.dumps(response, indent=2)}")
            responses.append(response) # For testing purposes
        except Exception as e:
            logger.error(f"Failed to send email notification to {email} in {org_name_en}: {e}")
    else:
        # Send email to each org owner/admin
        for user in org_users:
            email = user["userName"]
            if DRY_RUN_LOG_MODE:
                logger.info(f"DRY RUN Enabled: would send email to {email} in {org_name_en} with these decays:\n{json.dumps(domains, indent=2)}")
                responses.append({})
                continue
            try:
                response = notify_client.send_email_notification(
                    email_address=email,
                    template_id=os.getenv("DETECT_DECAY_EMAIL_TEMPLATE_ID"),
                    personalisation={
                        "org_name_en": org_name_en,
                        "org_name_fr": org_name_fr,
                        "org_acronym_en": org_acronym_en,
                        "org_acronym_fr": org_acronym_fr,
                        "domains_en": domains_en,
                        "domains_fr": domains_fr,
                    },
                )           
                logger.info(f"Email sent to {email} in {org_name_en} with response: {json.dumps(response, indent=2)}")
                responses.append(response) # For testing purposes

            except Exception as e:
                logger.error(f"Failed to send email notification to {email} in {org_name_en}: {e}")
    return responses
