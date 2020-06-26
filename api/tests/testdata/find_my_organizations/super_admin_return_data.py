super_admin_expected_result_1 = {
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
                                        "user": {"displayName": "testuserread"},
                                        "permission": "USER_READ",
                                    }
                                },
                                {
                                    "node": {
                                        "user": {"displayName": "testsuperadmin"},
                                        "permission": "SUPER_ADMIN",
                                    }
                                },
                            ]
                        },
                    }
                },
                {
                    "node": {
                        "acronym": "ORG2",
                        "name": "Organization 2",
                        "slug": "organization-2",
                        "zone": "Muni",
                        "sector": "Transportation",
                        "province": "NS",
                        "city": "Halifax",
                        "domains": {
                            "edges": [{"node": {"url": "anothercooldomain.ca"}}]
                        },
                        "affiliatedUsers": {"edges": []},
                    }
                },
                {
                    "node": {
                        "acronym": "TESTUSERREAD-TESTEMAIL-CA",
                        "name": "testuserread@testemail.ca",
                        "slug": "testuserread-testemail-ca",
                        "zone": None,
                        "sector": None,
                        "province": None,
                        "city": None,
                        "domains": {"edges": []},
                        "affiliatedUsers": {
                            "edges": [
                                {
                                    "node": {
                                        "user": {"displayName": "testuserread"},
                                        "permission": "ADMIN",
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

super_admin_expected_result_2 = {
    "data": {
        "organizations": {
            "edges": [
                {
                    "node": {
                        "acronym": "ORG2",
                        "name": "Organization 2",
                        "slug": "organization-2",
                        "zone": "Muni",
                        "sector": "Transportation",
                        "province": "NS",
                        "city": "Halifax",
                        "domains": {
                            "edges": [{"node": {"url": "anothercooldomain.ca"}}]
                        },
                        "affiliatedUsers": {"edges": []},
                    }
                },
                {
                    "node": {
                        "acronym": "TESTUSERREAD-TESTEMAIL-CA",
                        "name": "testuserread@testemail.ca",
                        "slug": "testuserread-testemail-ca",
                        "zone": None,
                        "sector": None,
                        "province": None,
                        "city": None,
                        "domains": {"edges": []},
                        "affiliatedUsers": {
                            "edges": [
                                {
                                    "node": {
                                        "user": {"displayName": "testuserread"},
                                        "permission": "ADMIN",
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
                                        "user": {"displayName": "testuserread"},
                                        "permission": "USER_READ",
                                    }
                                },
                                {
                                    "node": {
                                        "user": {"displayName": "testsuperadmin"},
                                        "permission": "SUPER_ADMIN",
                                    }
                                },
                            ]
                        },
                    }
                },
            ]
        }
    }
}

super_admin_expected_result_3 = {
    "data": {
        "organizations": {
            "edges": [
                {
                    "node": {
                        "acronym": "TESTUSERREAD-TESTEMAIL-CA",
                        "name": "testuserread@testemail.ca",
                        "slug": "testuserread-testemail-ca",
                        "zone": None,
                        "sector": None,
                        "province": None,
                        "city": None,
                        "domains": {"edges": []},
                        "affiliatedUsers": {
                            "edges": [
                                {
                                    "node": {
                                        "user": {"displayName": "testuserread"},
                                        "permission": "ADMIN",
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
                                        "user": {"displayName": "testuserread"},
                                        "permission": "USER_READ",
                                    }
                                },
                                {
                                    "node": {
                                        "user": {"displayName": "testsuperadmin"},
                                        "permission": "SUPER_ADMIN",
                                    }
                                },
                            ]
                        },
                    }
                },
                {
                    "node": {
                        "acronym": "ORG2",
                        "name": "Organization 2",
                        "slug": "organization-2",
                        "zone": "Muni",
                        "sector": "Transportation",
                        "province": "NS",
                        "city": "Halifax",
                        "domains": {
                            "edges": [{"node": {"url": "anothercooldomain.ca"}}]
                        },
                        "affiliatedUsers": {"edges": []},
                    }
                },
            ]
        }
    }
}

super_admin_expected_result_4 = {
    "data": {
        "organizations": {
            "edges": [
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
                                        "user": {"displayName": "testuserread"},
                                        "permission": "USER_READ",
                                    }
                                },
                                {
                                    "node": {
                                        "user": {"displayName": "testsuperadmin"},
                                        "permission": "SUPER_ADMIN",
                                    }
                                },
                            ]
                        },
                    }
                },
                {
                    "node": {
                        "acronym": "ORG2",
                        "name": "Organization 2",
                        "slug": "organization-2",
                        "zone": "Muni",
                        "sector": "Transportation",
                        "province": "NS",
                        "city": "Halifax",
                        "domains": {
                            "edges": [{"node": {"url": "anothercooldomain.ca"}}]
                        },
                        "affiliatedUsers": {"edges": []},
                    }
                },
                {
                    "node": {
                        "acronym": "TESTUSERREAD-TESTEMAIL-CA",
                        "name": "testuserread@testemail.ca",
                        "slug": "testuserread-testemail-ca",
                        "zone": None,
                        "sector": None,
                        "province": None,
                        "city": None,
                        "domains": {"edges": []},
                        "affiliatedUsers": {
                            "edges": [
                                {
                                    "node": {
                                        "user": {"displayName": "testuserread"},
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
