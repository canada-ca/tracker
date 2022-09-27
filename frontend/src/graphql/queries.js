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
            dmarc {
              total
              categories {
                name
                count
                percentage
              }
            }
            https {
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

export const HTTPS_AND_DMARC_SUMMARY = gql`
  query LandingPageSummaries {
    httpsSummary {
      total
      categories {
        name
        count
        percentage
      }
    }
    dmarcPhaseSummary {
      total
      categories {
        name
        count
        percentage
      }
    }
  }
`

export const GET_ORGANIZATION_DOMAINS_STATUSES_CSV = gql`
  query GetOrganizationDomainsStatusesCSV(
    $orgSlug: Slug!
  ) {
    findOrganizationBySlug(orgSlug: $orgSlug) {
        toCsv
    }
  }
`

export const GET_ALL_ORGANIZATION_DOMAINS_STATUSES_CSV = gql`
  query GetAllOrganizationDomainStatuses {
    getAllOrganizationDomainStatuses
  }
`

export const GET_ONE_TIME_SCANS = gql`
  query GetOneTimeScans {
    getOneTimeScans @client
  }
`

export const GET_ONE_TIME_DMARC_SCANS = gql`
  query GetOneTimeDmarcScans {
    getOneTimeDmarcScans @client
  }
`
export const GET_ONE_TIME_DKIM_SCANS = gql`
  query GetOneTimeDkimScans {
    getOneTimeDkimScans @client
  }
`
export const GET_ONE_TIME_HTTPS_SCANS = gql`
  query GetOneTimeHttpsScans {
    getOneTimeHttpsScans @client
  }
`
export const GET_ONE_TIME_SPF_SCANS = gql`
  query GetOneTimeSpfScans {
    getOneTimeSpfScans @client
  }
`
export const GET_ONE_TIME_SSL_SCANS = gql`
  query GetOneTimeSslScans {
    getOneTimeSslScans @client
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
        https(first: 1, orderBy: { field: TIMESTAMP, direction: DESC }) {
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
        ssl(first: 1, orderBy: { field: TIMESTAMP, direction: DESC }) {
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
        dkim(first: 1, orderBy: { field: TIMESTAMP, direction: DESC }) {
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
        dmarc(first: 1, orderBy: { field: TIMESTAMP, direction: DESC }) {
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
        spf(first: 1, orderBy: { field: TIMESTAMP, direction: DESC }) {
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

export const PAGINATED_ORG_AFFILIATIONS_ADMIN_PAGE = gql`
  query PaginatedOrgAffiliations(
    $orgSlug: Slug!
    $first: Int
    $after: String
    $search: String
  ) {
    findOrganizationBySlug(orgSlug: $orgSlug) {
      id
      affiliations(first: $first, after: $after, search: $search) {
        edges {
          node {
            id
            permission
            user {
              id
              userName
              displayName
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
            selectors
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
        https {
          total
          categories {
            name
            count
            percentage
          }
        }
        dmarcPhase {
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
`

export const PAGINATED_ORG_DOMAINS = gql`
  query OrgDomainsNext(
    $slug: Slug!
    $first: Int
    $after: String
    $orderBy: DomainOrder
    $search: String
  ) {
    findOrganizationBySlug(orgSlug: $slug) {
      id
      domains(
        first: $first
        after: $after
        orderBy: $orderBy
        search: $search
      ) {
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
            status {
              ciphers
              curves
              dkim
              dmarc
              hsts
              https
              policy
              protocols
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
              displayName
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
          status {
            ciphers
            curves
            dkim
            dmarc
            hsts
            https
            policy
            protocols
            spf
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
    isUserAdmin
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
`

export const PAGINATED_DMARC_REPORT = gql`
  query PaginatedDmarcReport(
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
                guidanceTag {
                  guidance
                  refLinks {
                    refLink
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
                guidanceTag {
                  guidance
                  refLinks {
                    refLink
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

export const ORGANIZATION_INFORMATION = gql`
  query OrganizationInformation($orgSlug: Slug!) {
    findOrganizationBySlug(orgSlug: $orgSlug) {
      id
      acronym
      name
      slug
      zone
      sector
      country
      province
      city
      verified
    }
  }
`

export const ADMIN_PAGE = gql`
  query AdminAffiliations(
    $after: String
    $first: Int
    $before: String
    $last: Int
    $orderBy: OrganizationOrder
    $isAdmin: Boolean
    $includeSuperAdminOrg: Boolean
    $search: String
  ) {
    findMyOrganizations(
      after: $after
      first: $first
      before: $before
      last: $last
      orderBy: $orderBy
      isAdmin: $isAdmin
      includeSuperAdminOrg: $includeSuperAdminOrg
      search: $search
    ) {
      edges {
        node {
          id
          acronym
          slug
          name
        }
      }
    }
    isUserSuperAdmin
  }
`

export const IS_USER_ADMIN = gql`
  query IsUserAdmin($orgId: ID!) {
    isUserAdmin(orgId: $orgId)
  }
`

export const IS_USER_SUPER_ADMIN = gql`
  query isUserSuperAdmin {
    isUserSuperAdmin
  }
`

export const IS_LOGIN_REQUIRED = gql`
  query LoginRequired {
    loginRequired
  }
`

export const FIND_MY_USERS = gql`
  query FindMyUsers(
    $first: Int
    $after: String
    $orderBy: AffiliationUserOrder
    $search: String
  ) {
    findMyUsers(
      orderBy: $orderBy
      first: $first
      after: $after
      search: $search
    ) {
      edges {
        cursor
        node {
          id
          userName
          displayName
          emailValidated
          affiliations(first: 10) {
            totalCount
            edges {
              node {
                permission
                organization {
                  id
                  acronym
                  name
                  slug
                  verified
                }
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
        __typename
      }
    }
  }
`
export const WEBCHECK_ORGS = gql`
  query FindMyWebCheckOrgs(
    $after: String
    $first: Int!
    $orderBy: OrganizationOrder!
    $search: String
  ) {
    findMyWebCheckOrganizations(
      first: $first
      after: $after
      orderBy: $orderBy
      search: $search
    ) {
      totalCount
      edges {
        cursor
        node {
          id
          acronym
          name
          slug
          tags {
            edges {
              id
              severity
            }
            totalCount
          }
          domains {
            totalCount
            edges {
              id
              domain
              lastRan
              tags {
                edges {
                  id
                  firstDetected
                  severity
                }
                totalCount
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`
