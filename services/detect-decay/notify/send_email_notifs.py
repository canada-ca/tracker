import logging
import os
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
    
    domains = custom_format(domains)
    responses = []
    for user in org_users:
        email = user["userName"]
        display_name = user["displayName"]
        try:
            response = notify_client.send_email_notification(
                email_address=email,
                template_id=os.getenv("EMAIL_TEMPLATE_ID"),
                personalisation={
                    "org_name_en": org_name_en,
                    "org_name_fr": org_name_fr,
                    "org_acronym_en": org_acronym_en,
                    "org_acronym_fr": org_acronym_fr,
                    "domains": domains,
                },
            )           
            logging.info(f"Email sent to {display_name} with response: {response}")
            responses.append(response)

        except Exception as e:
            logging.error(f"Failed to send email notification to {display_name}: {e}")
    return responses
    