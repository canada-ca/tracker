org_admin_expected_result_1 = {
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
                        "affiliatedUsers": {
                            "edges": [
                                {
                                    "node": {
                                        "user": {"displayName": "testadmin"},
                                        "permission": "ADMIN",
                                    }
                                }
                            ]
                        },
                    }
                },
                {
                    "node": {
                        "acronym": "TESTADMIN-TESTEMAIL-CA",
                        "name": "testadmin@testemail.ca",
                        "slug": "testadmin-testemail-ca",
                        "zone": None,
                        "sector": None,
                        "province": None,
                        "city": None,
                        "domains": {"edges": []},
                        "affiliatedUsers": {
                            "edges": [
                                {
                                    "node": {
                                        "user": {"displayName": "testadmin"},
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

org_admin_expected_result_2 = {
    "data": {
        "organizations": {
            "edges": [
                {
                    "node": {
                        "acronym": "TESTADMIN-TESTEMAIL-CA",
                        "name": "testadmin@testemail.ca",
                        "slug": "testadmin-testemail-ca",
                        "zone": None,
                        "sector": None,
                        "province": None,
                        "city": None,
                        "domains": {"edges": []},
                        "affiliatedUsers": {
                            "edges": [
                                {
                                    "node": {
                                        "user": {"displayName": "testadmin"},
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
                        "affiliatedUsers": {
                            "edges": [
                                {
                                    "node": {
                                        "user": {"displayName": "testadmin"},
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
