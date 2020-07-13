super_admin_expected_result = {
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
                        "acronym": "SA",
                        "name": "Super Admin",
                        "slug": "super-admin",
                        "zone": None,
                        "sector": None,
                        "province": None,
                        "city": None,
                        "domains": {"edges": []},
                        "affiliatedUsers": {
                            "edges": [
                                {
                                    "node": {
                                        "permission": "SUPER_ADMIN",
                                        "user": {"displayName": "testsuperadmin"},
                                    }
                                }
                            ]
                        },
                    }
                },
                {
                    "node": {
                        "acronym": "TESTSUPERADMIN-TESTEMAIL-CA",
                        "name": "testsuperadmin@testemail.ca",
                        "slug": "testsuperadmin-testemail-ca",
                        "zone": None,
                        "sector": None,
                        "province": None,
                        "city": None,
                        "domains": {"edges": []},
                        "affiliatedUsers": {
                            "edges": [
                                {
                                    "node": {
                                        "user": {"displayName": "testsuperadmin"},
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
