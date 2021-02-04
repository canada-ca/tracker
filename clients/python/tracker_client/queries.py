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

DOMAIN_RESULTS = gql(
    """
  query GetScanResults($domain: DomainScalar!) {
    findDomainByDomain(domain: $domain) {
      domain
      lastRan
      web {
        https(first: 100) {
          edges {
            node {
              implementation
              enforced
              hsts
              hstsAge
              preloaded
              guidanceTags(first: 100) {
                edges {
                  node {
                    tagId
                    tagName
                    guidance
                    refLinks {
                      description
                      refLink
                    }
                    refLinksTech {
                      description
                      refLink
                    }
                  }
                }
              }
            }
          }
        }
        ssl(first: 100) {
          edges {
            node {
              guidanceTags(first: 100) {
                edges {
                  node {
                    tagId
                    tagName
                    guidance
                    refLinks {
                      description
                      refLink
                    }
                    refLinksTech {
                      description
                      refLink
                    }
                  }
                }
              }
            }
          }
        }
      }
      email {
        dkim(first: 100) {
          edges {
            node {
              results(first: 100) {
                edges {
                  node {
                    selector
                    guidanceTags(first: 100) {
                      edges {
                        cursor
                        node {
                          tagId
                          tagName
                          guidance
                          refLinks {
                            description
                            refLink
                          }
                          refLinksTech {
                            description
                            refLink
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        dmarc(first: 100) {
          edges {
            node {
              dmarcPhase
              record
              pPolicy
              spPolicy
              pct
              guidanceTags(first: 100) {
                edges {
                  node {
                    tagId
                    tagName
                    guidance
                    refLinks {
                      description
                      refLink
                    }
                    refLinksTech {
                      description
                      refLink
                    }
                  }
                }
              }
            }
          }
        }
        spf(first: 100) {
          edges {
            node {
              lookups
              record
              spfDefault
              guidanceTags(first: 100) {
                edges {
                  node {
                    tagId
                    tagName
                    guidance
                    refLinks {
                      description
                      refLink
                    }
                    refLinksTech {
                      description
                      refLink
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }


    """
)

DOMAIN_STATUS = gql(
    """
  query GetDomainStatus($domain: DomainScalar!) {
    findDomainByDomain(domain: $domain) {
      domain
      lastRan
      status {
        https
        ssl
        dmarc
        dkim
        spf
      }
    }
  }
  """
)
