from gql import gql


SIGNIN_MUTATION = gql(
    """
    mutation signIn($creds: SignInInput!) {
        signIn (input: $creds) {
            result {
                ... on RegularSignInResult {
                    authResult {
                        authToken
                    }
                }
            }
        }
    }
    """
)

ALL_DOMAINS_QUERY = gql(
    """
    query getAllDomains {
        findMyOrganizations(first: 100) {
            edges {
                node {
                    acronym
                    domains(first: 100){
                        edges{
                            node{
                                domain
                            }
                        }
                    }     
                }
            }
        }
    }
    """
)

DOMAINS_BY_SLUG = gql(
    """
    query orgBySlug($org: Slug!){
        findOrganizationBySlug(orgSlug: $org){
            domains(first: 100){
                edges{
                    node{
                        domain
                    }
                }
            }
        }
    }
    """
)

DMARC_SUMMARY = gql(
    """
    query domainDMARCSummary(
        $domain: DomainScalar!
        $month: PeriodEnums!
        $year: Year!
    ) {
        findDomainByDomain(domain: $domain) {
            domain
            dmarcSummaryByPeriod(month: $month, year: $year) {
                month
                year
                categoryPercentages {
                    fullPassPercentage
                    passSpfOnlyPercentage
                    passDkimOnlyPercentage
                    failPercentage
                    totalMessages
                }
            }
        }
    }
    """
)

DMARC_YEARLY_SUMMARIES = gql(
    """
    query domainAllDMARCSummaries($domain: DomainScalar!) {
        findDomainByDomain(domain: $domain) {
            domain
            yearlyDmarcSummaries {
                month
                year
                categoryPercentages {
                    fullPassPercentage
                    passSpfOnlyPercentage
                    passDkimOnlyPercentage
                    failPercentage
                    totalMessages
                }
            }
        }
    }
    """
)

ALL_ORG_SUMMARIES = gql(
    """
    query getAllSummaries {
        findMyOrganizations(first: 100) {
            edges {
                node {
                    acronym
                    domainCount
                    summaries{
                        web{
                            total
                            categories{
                                name
                                count
                                percentage
                            }
                        }
                         mail{
                            total
                            categories{
                                name
                                count
                                percentage
                            }
                        }
                    }
                }
            }
        }
    }

    """
)

SUMMARY_BY_SLUG = gql(
    """
    query getSummaryBySlug($orgSlug: Slug!) {
        findOrganizationBySlug(orgSlug: $orgSlug) {
            acronym
            domainCount
            summaries {
                web {
                    total
                    categories {
                        name
                        count
                        percentage
                    }
                }
                mail {
                    total
                    categories {
                        name
                        count
                        percentage
                    }
                }
            }
        }
    }
    """
)
