import logging
import os
import json
from notify.notify_client import notify_client


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
        translation_map = {
            "HTTPS Configuration": "Configuration HTTPS",
            "HSTS Implementation": "Mise en œuvre HSTS",
            "Certificates": "Certificats",
            "Protocols": "Protocoles",
            "Ciphers": "Chiffres",
            "Curves": "Courbes"
        }
        for key, statuses in d.items():
            for i, s in enumerate(statuses):
                if s in translation_map:
                    statuses[i] = translation_map[s]
        return d
    
    domains_en = custom_format(domains)
    domains_fr = custom_format(translate_to_fr(domains))
    
    responses = []
    # Send email to each org owner/admin
    for user in org_users:
        email = user["userName"]
        try:
            response = notify_client.send_email_notification(
                email_address=email,
                template_id=os.getenv("EMAIL_TEMPLATE_ID"),
                personalisation={
                    "org_name_en": org_name_en,
                    "org_name_fr": org_name_fr,
                    "org_acronym_en": org_acronym_en,
                    "org_acronym_fr": org_acronym_fr,
                    "domains_en": domains_en,
                    "domains_fr": domains_fr,
                },
            )           
            logging.info(f"Email sent to {email} in {org_name_en} with response: {json.dumps(response, indent=2)}")
            responses.append(response) # For testing purposes

        except Exception as e:
            logging.error(f"Failed to send email notification to {email} in {org_name_en}: {e}")
    return responses
