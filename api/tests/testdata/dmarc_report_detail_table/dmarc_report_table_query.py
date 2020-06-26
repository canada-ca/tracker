test_query = """
{
    dmarcReportDetailTables(
        input: {
            domainSlug: "test-domain-gc-ca"
            year: "2020"
            period: MAY
        }
    ) {
        month
        year
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
"""
