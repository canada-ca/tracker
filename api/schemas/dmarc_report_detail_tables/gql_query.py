from gql import gql

query_string = gql(
    """
    query (
        $domain:GCURL!
        $startDate:CustomDate!
        $endDate:CustomDate!
        $thirtyDays:Boolean
    ) {
        getDmarcSummaryByPeriod(
            domain: $domain
            startDate: $startDate
            endDate: $endDate
            thirtyDays: $thirtyDays
        ) {
            period {
                startDate
                endDate
                detailTables {
                    fullPass {
                        sourceIpAddress
                        envelopeFrom
                        spfDomains
                        dkimDomains
                        dkimSelectors
                        totalMessages
                        countryCode
                        ispOrg
                        prefixOrg
                        asName
                        asNum
                        asOrg
                        dnsHost
                        dnsDomain
                    }
                    spfFailure {
                        sourceIpAddress
                        envelopeFrom
                        spfDomains
                        dkimDomains
                        dkimSelectors
                        totalMessages
                        countryCode
                        ispOrg
                        prefixOrg
                        asName
                        asNum
                        asOrg
                        dnsHost
                        dnsDomain
                    }
                    spfMisaligned {
                        sourceIpAddress
                        envelopeFrom
                        spfDomains
                        dkimDomains
                        dkimSelectors
                        totalMessages
                        countryCode
                        ispOrg
                        prefixOrg
                        asName
                        asNum
                        asOrg
                        dnsHost
                        dnsDomain
                    }
                    dkimFailure {
                        sourceIpAddress
                        envelopeFrom
                        spfDomains
                        dkimDomains
                        dkimSelectors
                        totalMessages
                        countryCode
                        ispOrg
                        prefixOrg
                        asName
                        asNum
                        asOrg
                        dnsHost
                        dnsDomain
                    }
                    dkimMisaligned {
                        sourceIpAddress
                        envelopeFrom
                        spfDomains
                        dkimDomains
                        dkimSelectors
                        totalMessages
                        countryCode
                        ispOrg
                        prefixOrg
                        asName
                        asNum
                        asOrg
                        dnsHost
                        dnsDomain
                    }
                    dmarcFailure {
                        sourceIpAddress
                        envelopeFrom
                        spfDomains
                        dkimDomains
                        dkimSelectors
                        totalMessages
                        countryCode
                        ispOrg
                        prefixOrg
                        asName
                        asNum
                        asOrg
                        dnsHost
                        dnsDomain
                    }
                }
            }
        }
    }
    """
)
