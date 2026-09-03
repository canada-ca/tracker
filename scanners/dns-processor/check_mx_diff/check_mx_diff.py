import os

from notify.send_mx_diff_email_alerts import send_mx_diff_email_alerts


def check_mx_diff(processed_results, domain_id, db):
    new_mx = processed_results.get("mx_records").get("hosts")
    mx_record_diff = False
    # fetch most recent scan of domain
    last_mx_cursor = db.aql.execute(
        """
            FOR v, e IN 1..1 OUTBOUND @domain_id domainsDNS
                SORT v.timestamp DESC
                LIMIT 1
                RETURN v
            """,
        bind_vars={"domain_id": domain_id},
    )
    # if no previous scan, return False as we can't compare records
    if last_mx_cursor.empty():
        return False

    last_mx = last_mx_cursor.next().get("mxRecords", {}).get("hosts", [])

    # compare mx_records to most recent scan
    # if different, set mx_records_diff to True
    # check number of hosts
    if len(new_mx) != len(last_mx):
        mx_record_diff = True
    else:
        # check hostnames
        hostnames_new = []
        hostnames_last = []
        for i in range(len(new_mx)):
            hostnames_new.append(new_mx[i]["hostname"])
            hostnames_last.append(last_mx[i]["hostname"])

        if set(hostnames_new) != set(hostnames_last):
            mx_record_diff = True

    # fetch domain org, filter by verified and externally managed
    domain_org_cursor = db.aql.execute(
        """
            FOR v, e IN 1..1 INBOUND @domain_id claims
                FILTER v.verified == true
                LIMIT 1
                RETURN v
            """,
        bind_vars={"domain_id": domain_id},
    )
    # if no org, return early
    if domain_org_cursor.empty():
        return mx_record_diff

    domain_org = domain_org_cursor.next()

    # send alerts if true
    if mx_record_diff and os.getenv("ALERT_SUBS"):
        current_val = []
        for host in new_mx:
            current_val.append(f"{host['hostname']} {host['preference']}")
        if len(current_val) == 0:
            current_val = "null"
        else:
            current_val = ";".join(current_val)

        prev_val = []
        for host in last_mx:
            prev_val.append(f"{host['hostname']} {host['preference']}")

        if len(prev_val) == 0:
            prev_val = "null"
        else:
            prev_val = ";".join(prev_val)

        send_mx_diff_email_alerts(
            domain=processed_results.get("domain"),
            record_type="MX",
            org=domain_org,
            prev_val=prev_val,
            current_val=current_val,
        )

    return mx_record_diff
