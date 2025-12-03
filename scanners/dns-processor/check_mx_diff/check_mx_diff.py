import os
from notify.send_mx_diff_email_alerts import send_mx_diff_email_alerts

ALERT_SUBS = os.getenv("ALERT_SUBS")

def check_mx_diff(processed_results, domain_id, db):
    new_mx = processed_results.get("mx_records").get("hosts")
    mx_record_diff = False

    # Fetch most recent scan of domain
    last_mx_cursor = db.aql.execute(
        """
        FOR v, e IN 1..1 OUTBOUND @domain_id domainsDNS
            SORT v.timestamp DESC
            LIMIT 1
            RETURN v
        """,
        bind_vars={"domain_id": domain_id},
    )

    # If no previous scan, return False as we can't compare records
    if last_mx_cursor.empty():
        return False

    last_mx = last_mx_cursor.next().get("mxRecords", {}).get("hosts", [])

    # Compare mx_records to most recent scan
    if len(new_mx) != len(last_mx):
        mx_record_diff = True
    else:
        hostnames_new = [host["hostname"] for host in new_mx]
        hostnames_last = [host["hostname"] for host in last_mx]

        if set(hostnames_new) != set(hostnames_last):
            mx_record_diff = True

    # Fetch domain org, filter by verified and externally managed
    domain_org_cursor = db.aql.execute(
        """
        FOR v, e IN 1..1 INBOUND @domain_id claims
            FILTER v.verified == true
            LIMIT 1
            RETURN v
        """,
        bind_vars={"domain_id": domain_id},
    )

    # If no org, return early
    if domain_org_cursor.empty():
        return mx_record_diff

    domain_org = domain_org_cursor.next()

    # Send alerts if true
    if mx_record_diff and ALERT_SUBS:
        current_val = ";".join(
            [f"{host['hostname']} {host['preference']}" for host in new_mx]
        ) or "null"

        prev_val = ";".join(
            [f"{host['hostname']} {host['preference']}" for host in last_mx]
        ) or "null"

        send_mx_diff_email_alerts(
            domain=processed_results.get("domain"),
            record_type="MX",
            org=domain_org,
            prev_val=prev_val,
            current_val=current_val,
        )

    return mx_record_diff