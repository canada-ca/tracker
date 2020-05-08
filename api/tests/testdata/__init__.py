accurateplastics_report = {
    "xml_schema": "draft",
    "report_metadata": {
        "org_name": "accurateplastics.com",
        "org_email": "administrator@accurateplastics.com",
        "org_extra_contact_info": "null",
        "report_id": "example.com:1538463741",
        "begin_date": "2018-10-01 13:07:12",
        "end_date": "2018-10-01 13:07:12",
        "errors": ["Invalid XML: not well-formed (invalid token): line 5, column 17"],
    },
    "policy_published": {
        "domain": "example.com",
        "adkim": "r",
        "aspf": "r",
        "p": "none",
        "sp": "reject",
        "pct": "100",
        "fo": "0",
    },
    "records": [
        {
            "source": {
                "ip_address": "12.20.127.122",
                "country": "US",
                "reverse_dns": "null",
                "base_domain": "null",
            },
            "count": 1,
            "alignment": {"spf": False, "dkim": False, "dmarc": False},
            "policy_evaluated": {
                "disposition": "none",
                "dkim": "fail",
                "spf": "fail",
                "policy_override_reasons": ["TESTING TEXT"],
            },
            "identifiers": {
                "header_from": "example.com",
                "envelope_from": "null",
                "envelope_to": "null",
            },
            "auth_results": {
                "dkim": [
                    {
                        "domain": "toptierhighticket.club",
                        "selector": "default",
                        "result": "pass",
                    }
                ],
                "spf": [{"domain": "null", "scope": "mfrom", "result": "none"}],
            },
        }
    ],
}
