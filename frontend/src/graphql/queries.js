import { gql } from '@apollo/client'

export const PAGINATED_ORGANIZATIONS = gql`
  query PaginatedOrganizations(
    $after: String
    $first: Int!
    $field: OrganizationOrderField!
    $direction: OrderDirection!
    $search: String
    $includeSuperAdminOrg: Boolean
  ) {
    findMyOrganizations(
      after: $after
      first: $first
      orderBy: { field: $field, direction: $direction }
      search: $search
      includeSuperAdminOrg: $includeSuperAdminOrg
    ) {
      edges {
        cursor
        node {
          id
          acronym
          name
          slug
          domainCount
          verified
          summaries {
            mail {
              total
              categories {
                name
                count
                percentage
              }
            }
            web {
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
      pageInfo {
        hasNextPage
        endCursor
        hasPreviousPage
        startCursor
      }
    }
  }
`

export const WEB_AND_EMAIL_SUMMARIES = gql`
  query LandingPageSummaries {
    webSummary {
      categories {
        name
        count
        percentage
      }
      total
    }
    mailSummary {
      categories {
        name
        count
        percentage
      }
      total
    }
  }
`

export const ORGANIZATION_BY_SLUG = gql`
  query FindOrganizationDetailBySlug($slug: Slug!) {
    organization: findOrganizationDetailBySlug(slug: $slug) {
      id
      name
      acronym
      province
      domains {
        edges {
          node {
            id
            url
            lastRan
          }
        }
      }
    }
  }
`

export const GET_GUIDANCE_TAGS_OF_DOMAIN = gql`
  query FindDomainByDomain($domain: DomainScalar!) {
    findDomainByDomain(domain: $domain) {
      id
      domain
      lastRan
      status {
        https
        ssl
      }
      dmarcPhase
      hasDMARCReport
      web {
        https(first: 10, orderBy: { field: TIMESTAMP, direction: DESC }) {
          edges {
            cursor
            node {
              id
              timestamp
              implementation
              enforced
              hsts
              hstsAge
              preloaded
              negativeGuidanceTags(first: 5) {
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
              neutralGuidanceTags(first: 5) {
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
              positiveGuidanceTags(first: 5) {
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
        ssl(first: 10, orderBy: { field: TIMESTAMP, direction: DESC }) {
          edges {
            cursor
            node {
              id
              timestamp
              ccsInjectionVulnerable
              heartbleedVulnerable
              supportsEcdhKeyExchange
              acceptableCiphers
              acceptableCurves
              strongCiphers
              strongCurves
              weakCiphers
              weakCurves
              negativeGuidanceTags(first: 5) {
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
              neutralGuidanceTags(first: 5) {
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
              positiveGuidanceTags(first: 5) {
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
      email {
        dkim(first: 10, orderBy: { field: TIMESTAMP, direction: DESC }) {
          edges {
            cursor
            node {
              id
              timestamp
              results(first: 10) {
                edges {
                  cursor
                  node {
                    selector
                    negativeGuidanceTags(first: 5) {
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
                    neutralGuidanceTags(first: 5) {
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
                    positiveGuidanceTags(first: 5) {
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
        dmarc(first: 10, orderBy: { field: TIMESTAMP, direction: DESC }) {
          edges {
            cursor
            node {
              id
              timestamp
              record
              pPolicy
              spPolicy
              pct
              negativeGuidanceTags(first: 5) {
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
              neutralGuidanceTags(first: 5) {
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
              positiveGuidanceTags(first: 5) {
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
        spf(first: 10, orderBy: { field: TIMESTAMP, direction: DESC }) {
          edges {
            cursor
            node {
              id
              timestamp
              lookups
              record
              spfDefault
              negativeGuidanceTags(first: 5) {
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
              neutralGuidanceTags(first: 5) {
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
              positiveGuidanceTags(first: 5) {
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
`

export const ORGANIZATIONS = gql`
  query Organisations {
    organizations: findMyOrganizations(first: 10) {
      edges {
        node {
          name
          domainCount
          slug
        }
      }
    }
  }
`

export const ADMIN_PANEL = gql`
  query AdminPanel(
    $orgSlug: Slug!
    $domainsFirst: Int
    $domainsCursor: String
    $affiliationsFirst: Int
    $affiliationsCursor: String
  ) {
    findOrganizationBySlug(orgSlug: $orgSlug) {
      id
      name
      domains(first: $domainsFirst, after: $domainsCursor) {
        edges {
          node {
            id
            domain
            lastRan
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        totalCount
      }
      affiliations(first: $affiliationsFirst, after: $affiliationsCursor) {
        edges {
          node {
            id
            permission
            user {
              userName
            }
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        totalCount
      }
    }
  }
`

export const PAGINATED_ORG_AFFILIATIONS_ADMIN_PAGE = gql`
  query PaginatedOrgAffiliations($orgSlug: Slug!, $first: Int, $after: String) {
    findOrganizationBySlug(orgSlug: $orgSlug) {
      id
      affiliations(first: $first, after: $after) {
        edges {
          node {
            id
            permission
            user {
              id
              userName
            }
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        totalCount
      }
    }
  }
`

export const PAGINATED_ORG_DOMAINS_ADMIN_PAGE = gql`
  query PaginatedOrgDomains(
    $orgSlug: Slug!
    $first: Int
    $after: String
    $search: String
  ) {
    findOrganizationBySlug(orgSlug: $orgSlug) {
      id
      name
      domains(first: $first, after: $after, search: $search) {
        edges {
          node {
            id
            domain
            lastRan
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        totalCount
      }
    }
  }
`

export const ORG_DETAILS_PAGE = gql`
  query OrgDetails($slug: Slug!) {
    organization: findOrganizationBySlug(orgSlug: $slug) {
      id
      name
      acronym
      domainCount
      city
      province
      verified
      summaries {
        mail {
          total
          categories {
            name
            count
            percentage
          }
        }
        web {
          total
          categories {
            name
            count
            percentage
          }
        }
      }
      affiliations(first: 1) {
        totalCount
        edges {
          node {
            id
          }
        }
      }
    }
  }
`

export const PAGINATED_ORG_DOMAINS = gql`
  query OrgDomainsNext($slug: Slug!, $first: Int, $after: String) {
    findOrganizationBySlug(orgSlug: $slug) {
      id
      domains(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
          hasPreviousPage
          startCursor
        }
        edges {
          cursor
          node {
            id
            domain
            lastRan
            status {
              dkim
              dmarc
              https
              spf
              ssl
            }
            hasDMARCReport
          }
        }
      }
    }
  }
`

export const PAGINATED_ORG_AFFILIATIONS = gql`
  query OrgUsersNext($slug: Slug!, $first: Int, $after: String) {
    findOrganizationBySlug(orgSlug: $slug) {
      id
      affiliations(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
          hasPreviousPage
          startCursor
        }
        totalCount
        edges {
          cursor
          node {
            permission
            user {
              id
              userName
            }
          }
        }
      }
    }
  }
`

export const PAGINATED_DOMAINS = gql`
  query Domains(
    $first: Int
    $after: String
    $orderBy: DomainOrder
    $search: String
  ) {
    findMyDomains(
      first: $first
      after: $after
      orderBy: $orderBy
      search: $search
    ) {
      edges {
        cursor
        node {
          id
          domain
          lastRan
          status {
            dkim
            dmarc
            https
            spf
            ssl
          }
          hasDMARCReport
          __typename
        }
        __typename
      }
      pageInfo {
        hasNextPage
        endCursor
        hasPreviousPage
        startCursor
        __typename
      }
      __typename
    }
  }
`

export const DOMAINS = gql`
  query Domains($number: Int, $cursor: String) {
    domains: findMyDomains(first: $number, after: $cursor) {
      edges {
        node {
          url
          slug
          lastRan
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`

export const GENERATE_OTP_URL = gql`
  query GenerateOtpUrl($email: EmailAddress!) {
    generateOtpUrl(email: $email)
  }
`

export const QUERY_USERLIST = gql`
  query UserList($slug: Slug!) {
    userList(orgSlug: $slug) {
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
      edges {
        node {
          id
          userName
          role
          tfa
        }
      }
    }
  }
`

export const QUERY_CURRENT_USER = gql`
  query UserPage {
    userPage: findMe {
      id
      userName
      displayName
      preferredLang
      phoneNumber
      tfaSendMethod
      phoneValidated
      emailValidated
    }
  }
`

export const DMARC_REPORT_SUMMARY_LIST = gql`
  query DmarcReportSummaryList($domain: DomainScalar!) {
    findDomainByDomain(domain: $domain) {
      id
      yearlyDmarcSummaries {
        month
        year
        categoryTotals {
          passSpfOnly
          passDkimOnly
          fullPass
          fail
        }
      }
    }
  }
`

export const DEMO_DMARC_REPORT_SUMMARY_LIST = gql`
  query DemoDmarcReportSummaryList($domainSlug: Slug!) {
    demoDmarcReportSummaryList(domainSlug: $domainSlug) {
      month
      year
      categoryTotals {
        fullPass
        passSpfOnly
        passDkimOnly
        fail
        total
      }
    }
  }
`

export const DMARC_REPORT_SUMMARY = gql`
  query DmarcReportSummary(
    $domainSlug: Slug!
    $period: PeriodEnums!
    $year: Year!
  ) {
    dmarcReportSummary(domainSlug: $domainSlug, period: $period, year: $year) {
      month
      year
      categoryTotals {
        fullPass
        passSpfOnly
        passDkimOnly
        fail
        total
      }
    }
  }
`

export const DMARC_REPORT_GRAPH = gql`
  query DmarcReportGraph($domain: DomainScalar!) {
    findDomainByDomain(domain: $domain) {
      id
      hasDMARCReport
      yearlyDmarcSummaries {
        month
        year
        domain {
          domain
        }
        categoryTotals {
          passSpfOnly
          passDkimOnly
          fullPass
          fail
        }
      }
    }
  }
`

export const PAGINATED_DKIM_FAILURE_REPORT = gql`
  query PaginatedDkimFailureReport(
    $domain: DomainScalar!
    $month: PeriodEnums!
    $year: Year!
    $after: String
    $first: Int
  ) {
    findDomainByDomain(domain: $domain) {
      id
      dmarcSummaryByPeriod(month: $month, year: $year) {
        domain {
          domain
        }
        month
        year
        detailTables {
          dkimFailure(after: $after, first: $first) {
            edges {
              node {
                dkimAligned
                dkimDomains
                dkimResults
                dkimSelectors
                dnsHost
                envelopeFrom
                guidance
                headerFrom
                sourceIpAddress
                totalMessages
              }
            }
            pageInfo {
              hasNextPage
              endCursor
              hasPreviousPage
              startCursor
            }
          }
        }
      }
    }
  }
`

export const PAGINATED_DMARC_FAILURE_REPORT = gql`
  query PaginatedDmarcFailureReport(
    $domain: DomainScalar!
    $month: PeriodEnums!
    $year: Year!
    $after: String
    $first: Int
  ) {
    findDomainByDomain(domain: $domain) {
      id
      dmarcSummaryByPeriod(month: $month, year: $year) {
        domain {
          domain
        }
        month
        year
        detailTables {
          dmarcFailure(after: $after, first: $first) {
            edges {
              node {
                dkimDomains
                dkimSelectors
                disposition
                dnsHost
                envelopeFrom
                headerFrom
                sourceIpAddress
                spfDomains
                totalMessages
              }
            }
            pageInfo {
              hasNextPage
              endCursor
              hasPreviousPage
              startCursor
            }
          }
        }
      }
    }
  }
`

export const PAGINATED_SPF_FAILURE_REPORT = gql`
  query PaginatedSpfFailureReport(
    $domain: DomainScalar!
    $month: PeriodEnums!
    $year: Year!
    $after: String
    $first: Int
  ) {
    findDomainByDomain(domain: $domain) {
      id
      dmarcSummaryByPeriod(month: $month, year: $year) {
        domain {
          domain
        }
        month
        year
        detailTables {
          spfFailure(after: $after, first: $first) {
            edges {
              node {
                dnsHost
                envelopeFrom
                guidance
                headerFrom
                sourceIpAddress
                spfAligned
                spfDomains
                spfResults
                totalMessages
              }
            }
            pageInfo {
              hasNextPage
              endCursor
              hasPreviousPage
              startCursor
            }
          }
        }
      }
    }
  }
`

export const PAGINATED_FULL_PASS_REPORT = gql`
  query PaginatedFullPassReport(
    $domain: DomainScalar!
    $month: PeriodEnums!
    $year: Year!
    $first: Int
    $after: String
  ) {
    findDomainByDomain(domain: $domain) {
      id
      dmarcSummaryByPeriod(month: $month, year: $year) {
        domain {
          domain
        }
        month
        year
        detailTables {
          fullPass(after: $after, first: $first) {
            edges {
              cursor
              node {
                sourceIpAddress
                envelopeFrom
                dkimDomains
                dkimSelectors
                dnsHost
                headerFrom
                spfDomains
                totalMessages
              }
            }
            pageInfo {
              hasNextPage
              endCursor
              hasPreviousPage
              startCursor
            }
          }
        }
      }
    }
  }
`

// export const DMARC_REPORT_PAGE = gql`
//   query DmarcReportPage(
//     $domain: DomainScalar!
//     $month: PeriodEnums!
//     $year: Year!
//   ) {
//     findDomainByDomain(domain: $domain) {
//       id
//       yearlyDmarcSummaries {
//         month
//         year
//         categoryTotals {
//           passSpfOnly
//           passDkimOnly
//           fullPass
//           fail
//         }
//       }
//       dmarcSummaryByPeriod(month: $month, year: $year) {
//         detailTables {
//           dkimFailure {
//             edges {
//               node {
//                 dkimAligned
//                 dkimDomains
//                 dkimResults
//                 dkimSelectors
//                 dnsHost
//                 envelopeFrom
//                 guidance
//                 headerFrom
//                 sourceIpAddress
//                 totalMessages
//               }
//             }
//           }
//           dmarcFailure {
//             edges {
//               node {
//                 dkimDomains
//                 dkimSelectors
//                 disposition
//                 dnsHost
//                 envelopeFrom
//                 headerFrom
//                 sourceIpAddress
//                 spfDomains
//                 totalMessages
//               }
//             }
//           }
//           fullPass {
//             edges {
//               node {
//                 sourceIpAddress
//                 envelopeFrom
//                 dkimDomains
//                 dkimSelectors
//                 dnsHost
//                 headerFrom
//                 spfDomains
//                 totalMessages
//               }
//             }
//           }
//           spfFailure {
//             edges {
//               node {
//                 dnsHost
//                 envelopeFrom
//                 guidance
//                 headerFrom
//                 sourceIpAddress
//                 spfAligned
//                 spfDomains
//                 spfResults
//                 totalMessages
//               }
//             }
//           }
//         }
//       }
//     }
//   }
// `

export const DEMO_DMARC_REPORT_SUMMARY = gql`
  query DmarcReportSummary(
    $domainSlug: Slug!
    $period: PeriodEnums!
    $year: Year!
  ) {
    demoDmarcReportSummary(
      domainSlug: $domainSlug
      period: $period
      year: $year
    ) {
      month
      year
      categoryTotals {
        fullPass
        passSpfOnly
        passDkimOnly
        fail
        total
      }
    }
  }
`

export const DMARC_REPORT_DETAIL_TABLES = gql`
  query DmarcReportDetailTables(
    $domain: DomainScalar!
    $month: PeriodEnums!
    $year: Year!
  ) {
    findDomainByDomain(domain: $domain) {
      id
      dmarcSummaryByPeriod(month: $month, year: $year) {
        detailTables {
          dkimFailure {
            edges {
              node {
                dkimAligned
                dkimDomains
                dkimResults
                dkimSelectors
                dnsHost
                envelopeFrom
                guidance
                headerFrom
                sourceIpAddress
                totalMessages
              }
            }
          }
          dmarcFailure {
            edges {
              node {
                dkimDomains
                dkimSelectors
                disposition
                dnsHost
                envelopeFrom
                headerFrom
                sourceIpAddress
                spfDomains
                totalMessages
              }
            }
          }
          fullPass {
            edges {
              node {
                sourceIpAddress
                envelopeFrom
                dkimDomains
                dkimSelectors
                dnsHost
                headerFrom
                spfDomains
                totalMessages
              }
            }
          }
          spfFailure {
            edges {
              node {
                dnsHost
                envelopeFrom
                guidance
                headerFrom
                sourceIpAddress
                spfAligned
                spfDomains
                spfResults
                totalMessages
              }
            }
          }
        }
      }
    }
  }
`

export const DEMO_DMARC_REPORT_DETAIL_TABLES = gql`
  query DemoDmarcReportDetailTables(
    $domainSlug: Slug!
    $period: PeriodEnums!
    $year: Year!
  ) {
    demoDmarcReportDetailTables(
      domainSlug: $domainSlug
      period: $period
      year: $year
    ) {
      month
      year
      detailTables {
        fullPass {
          sourceIpAddress
          envelopeFrom
          totalMessages
          countryCode
          prefixOrg
          dnsHost
          spfDomains
          dkimDomains
          dkimSelectors
        }
        spfFailure {
          sourceIpAddress
          envelopeFrom
          totalMessages
          countryCode
          prefixOrg
          dnsHost
          spfDomains
        }
        spfMisaligned {
          sourceIpAddress
          envelopeFrom
          totalMessages
          countryCode
          prefixOrg
          dnsHost
          spfDomains
        }
        dkimFailure {
          sourceIpAddress
          envelopeFrom
          totalMessages
          countryCode
          prefixOrg
          dnsHost
          dkimDomains
          dkimSelectors
        }
        dkimMisaligned {
          sourceIpAddress
          envelopeFrom
          totalMessages
          countryCode
          prefixOrg
          dnsHost
          dkimDomains
          dkimSelectors
        }
        dmarcFailure {
          sourceIpAddress
          envelopeFrom
          totalMessages
          countryCode
          prefixOrg
          dnsHost
          spfDomains
          dkimDomains
          dkimSelectors
        }
      }
    }
  }
`

export const PAGINATED_DMARC_REPORT_SUMMARY_TABLE = gql`
  query PaginatedDmarcReportSummaryTable(
    $month: PeriodEnums!
    $year: Year!
    $first: Int
    $after: String
    $orderBy: DmarcSummaryOrder
    $search: String
  ) {
    findMyDmarcSummaries(
      month: $month
      year: $year
      first: $first
      after: $after
      orderBy: $orderBy
      search: $search
    ) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      edges {
        node {
          id
          month
          year
          domain {
            domain
          }
          categoryPercentages {
            failPercentage
            fullPassPercentage
            passDkimOnlyPercentage
            passSpfOnlyPercentage
            totalMessages
          }
        }
      }
    }
  }
`

export const USER_AFFILIATIONS = gql`
  query UserAffiliations(
    $after: String
    $first: Int
    $before: String
    $last: Int
    $orderBy: AffiliationOrgOrder
  ) {
    findMe {
      id
      affiliations(
        after: $after
        first: $first
        before: $before
        last: $last
        orderBy: $orderBy
      ) {
        edges {
          node {
            organization {
              id
              acronym
              slug
            }
            permission
          }
        }
      }
    }
  }
`
