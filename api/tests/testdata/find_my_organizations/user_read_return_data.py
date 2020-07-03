user_read_expected_result = {
    "data": {
        "organizations": {
            "edges": [
                {
                    "node": {
                        "acronym": "ORG1",
                        "name": "Organization 1",
                        "slug": "organization-1",
                        "zone": "Prov",
                        "sector": "Banking",
                        "province": "Alberta",
                        "city": "Calgary",
                        "domains": {"edges": [{"node": {"url": "somecooldomain.ca"}}]},
                        "affiliatedUsers": {"edges": []},
                    }
                },
                {
                    "node": {
                        "acronym": "TESTREADER-TESTEMAIL-CA",
                        "name": "testreader@testemail.ca",
                        "slug": "testreader-testemail-ca",
                        "zone": None,
                        "sector": None,
                        "province": None,
                        "city": None,
                        "domains": {"edges": []},
                        "affiliatedUsers": {
                            "edges": [
                                {
                                    "node": {
                                        "user": {"displayName": "testreader"},
                                        "permission": "ADMIN",
                                    }
                                }
                            ]
                        },
                    }
                },
            ]
        }
    }
}
