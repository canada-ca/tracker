user_write_expected_result_1 = {
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
                        "acronym": "TESTWRITER-TESTEMAIL-CA",
                        "name": "testwriter@testemail.ca",
                        "slug": "testwriter-testemail-ca",
                        "zone": None,
                        "sector": None,
                        "province": None,
                        "city": None,
                        "domains": {"edges": []},
                        "affiliatedUsers": {
                            "edges": [
                                {
                                    "node": {
                                        "user": {"displayName": "testwriter"},
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

user_write_expected_result_2 = {
    "data": {
        "organizations": {
            "edges": [
                {
                    "node": {
                        "acronym": "TESTWRITER-TESTEMAIL-CA",
                        "name": "testwriter@testemail.ca",
                        "slug": "testwriter-testemail-ca",
                        "zone": None,
                        "sector": None,
                        "province": None,
                        "city": None,
                        "domains": {"edges": []},
                        "affiliatedUsers": {
                            "edges": [
                                {
                                    "node": {
                                        "user": {"displayName": "testwriter"},
                                        "permission": "ADMIN",
                                    }
                                }
                            ]
                        },
                    }
                },
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
            ]
        }
    }
}
