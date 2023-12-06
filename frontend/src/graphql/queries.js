import { gql } from '@apollo/client'
import { Guidance, Summary, Status } from './fragments'

export const PAGINATED_ORGANIZATIONS = gql`
  query PaginatedOrganizations(
    $after: String
    $first: Int!
    $field: OrganizationOrderField!
    $direction: OrderDirection!
    $search: String
    $includeSuperAdminOrg: Boolean
    $isVerified: Boolean
  ) {
    findMyOrganizations(
      after: $after
      first: $first
      orderBy: { field: $field, direction: $direction }
      search: $search
      includeSuperAdminOrg: $includeSuperAdminOrg
      isVerified: $isVerified
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

export const LANDING_PAGE_SUMMARIES = gql`
  query LandingPageSummaries {
    # Tier 1
    httpsSummary {
      ...RequiredSummaryFields
    }
    dmarcSummary {
      ...RequiredSummaryFields
    }
    # Tier 2
    webConnectionsSummary {
      ...RequiredSummaryFields
    }
    sslSummary {
      ...RequiredSummaryFields
    }
    spfSummary {
      ...RequiredSummaryFields
    }
    dkimSummary {
      ...RequiredSummaryFields
    }
    dmarcPhaseSummary {
      ...RequiredSummaryFields
    }
    # Tier 3
    webSummary {
      ...RequiredSummaryFields
    }
    mailSummary {
      ...RequiredSummaryFields
    }
  }
  ${Summary.fragments.requiredFields}
`

export const GET_ORGANIZATION_DOMAINS_STATUSES_CSV = gql`
  query GetOrganizationDomainsStatusesCSV($orgSlug: Slug!, $filters: [DomainFilter]) {
    findOrganizationBySlug(orgSlug: $orgSlug) {
      toCsv(filters: $filters)
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

export const PAGINATED_ORG_AFFILIATIONS_ADMIN_PAGE = gql`
  query PaginatedOrgAffiliations(
    $orgSlug: Slug!
    $first: Int
    $after: String
    $search: String
    $includePending: Boolean
  ) {
    findOrganizationBySlug(orgSlug: $orgSlug) {
      id
      affiliations(first: $first, after: $after, search: $search, includePending: $includePending) {
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
  query PaginatedOrgDomains($orgSlug: Slug!, $first: Int, $after: String, $search: String, $filters: [DomainFilter]) {
    findOrganizationBySlug(orgSlug: $orgSlug) {
      id
      name
      domains(first: $first, after: $after, search: $search, filters: $filters) {
        edges {
          node {
            id
            domain
            lastRan
            selectors
            claimTags
            hidden
            archived
            rcode
            organizations(first: 1) {
              totalCount
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

export const DOMAIN_GUIDANCE_PAGE = gql`
  query DomainGuidancePage($domain: DomainScalar!) {
    findDomainByDomain(domain: $domain) {
      domain
      lastRan
      rcode
      blocked
      wildcardSibling
      webScanPending
      status {
        ...RequiredDomainStatusFields
      }
      organizations(first: 20) {
        edges {
          node {
            name
            acronym
            slug
          }
        }
      }
      dmarcPhase
      hasDMARCReport
      userHasPermission
      mxRecordDiff(limit: 10, orderBy: { field: TIMESTAMP, direction: DESC }) {
        totalCount
        edges {
          node {
            id
            timestamp
            mxRecords {
              hosts {
                preference
                hostname
                addresses
              }
              warnings
            }
          }
        }
      }
      dnsScan(limit: 1, orderBy: { field: TIMESTAMP, direction: DESC }) {
        edges {
          cursor
          node {
            id
            domain
            timestamp
            baseDomain
            recordExists
            # cnameRecord
            mxRecords {
              hosts {
                preference
                hostname
                addresses
              }
              warnings
            }
            nsRecords {
              hostnames
              warnings
            }
            dkim {
              positiveTags {
                ...RequiredGuidanceTagFields
              }
              neutralTags {
                ...RequiredGuidanceTagFields
              }
              negativeTags {
                ...RequiredGuidanceTagFields
              }
              selectors {
                selector
                record
                keyLength
                keyType
                positiveTags {
                  ...RequiredGuidanceTagFields
                }
                neutralTags {
                  ...RequiredGuidanceTagFields
                }
                negativeTags {
                  ...RequiredGuidanceTagFields
                }
              }
            }
            dmarc {
              record
              pPolicy
              spPolicy
              pct
              positiveTags {
                ...RequiredGuidanceTagFields
              }
              neutralTags {
                ...RequiredGuidanceTagFields
              }
              negativeTags {
                ...RequiredGuidanceTagFields
              }
            }
            spf {
              lookups
              record
              spfDefault
              positiveTags {
                ...RequiredGuidanceTagFields
              }
              neutralTags {
                ...RequiredGuidanceTagFields
              }
              negativeTags {
                ...RequiredGuidanceTagFields
              }
            }
          }
        }
      }
      web(limit: 1, orderBy: { field: TIMESTAMP, direction: DESC }) {
        edges {
          node {
            timestamp
            domain
            results {
              ipAddress
              status
              results {
                timestamp
                tlsResult {
                  ipAddress
                  certificateStatus
                  sslStatus
                  protocolStatus
                  cipherStatus
                  curveStatus
                  supportsEcdhKeyExchange
                  heartbleedVulnerable
                  robotVulnerable
                  ccsInjectionVulnerable
                  acceptedCipherSuites {
                    ssl2_0CipherSuites {
                      name
                      strength
                    }
                    ssl3_0CipherSuites {
                      name
                      strength
                    }
                    tls1_0CipherSuites {
                      name
                      strength
                    }
                    tls1_1CipherSuites {
                      name
                      strength
                    }
                    tls1_2CipherSuites {
                      name
                      strength
                    }
                    tls1_3CipherSuites {
                      name
                      strength
                    }
                  }
                  acceptedEllipticCurves {
                    name
                    strength
                  }
                  positiveTags {
                    ...RequiredGuidanceTagFields
                  }
                  neutralTags {
                    ...RequiredGuidanceTagFields
                  }
                  negativeTags {
                    ...RequiredGuidanceTagFields
                  }
                  certificateChainInfo {
                    pathValidationResults {
                      opensslErrorString
                      wasValidationSuccessful
                      trustStore {
                        name
                        version
                      }
                    }
                    badHostname
                    mustHaveStaple
                    leafCertificateIsEv
                    receivedChainContainsAnchorCertificate
                    receivedChainHasValidOrder
                    verifiedChainHasSha1Signature
                    verifiedChainHasLegacySymantecAnchor
                    passedValidation
                    certificateChain {
                      notValidBefore
                      notValidAfter
                      issuer
                      subject
                      expiredCert
                      selfSignedCert
                      certRevoked
                      certRevokedStatus
                      commonNames
                      serialNumber
                      signatureHashAlgorithm
                      sanList
                    }
                  }
                }
                connectionResults {
                  httpLive
                  httpsLive
                  httpsStatus
                  hstsStatus
                  httpImmediatelyUpgrades
                  httpEventuallyUpgrades
                  httpsImmediatelyDowngrades
                  httpsEventuallyDowngrades
                  hstsParsed {
                    maxAge
                    includeSubdomains
                    preload
                  }
                  positiveTags {
                    ...RequiredGuidanceTagFields
                  }
                  neutralTags {
                    ...RequiredGuidanceTagFields
                  }
                  negativeTags {
                    ...RequiredGuidanceTagFields
                  }
                  httpChainResult {
                    scheme
                    domain
                    uri
                    hasRedirectLoop
                    connections {
                      uri
                      connection {
                        statusCode
                        redirectTo
                        headers
                        blockedCategory
                        HSTS
                      }
                      error
                      scheme
                    }
                  }
                  httpsChainResult {
                    scheme
                    domain
                    uri
                    hasRedirectLoop
                    connections {
                      uri
                      connection {
                        statusCode
                        redirectTo
                        headers
                        blockedCategory
                        HSTS
                      }
                      error
                      scheme
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
  ${Status.fragments.requiredFields}
  ${Guidance.fragments.requiredFields}
`

export const ORG_DETAILS_PAGE = gql`
  query OrgDetails($slug: Slug!) {
    organization: findOrganizationBySlug(orgSlug: $slug) {
      id
      name
      acronym
      verified
      userHasPermission
      summaries {
        https {
          ...RequiredSummaryFields
        }
        dmarc {
          ...RequiredSummaryFields
        }
        dkim {
          ...RequiredSummaryFields
        }
        spf {
          ...RequiredSummaryFields
        }
        ssl {
          ...RequiredSummaryFields
        }
        webConnections {
          ...RequiredSummaryFields
        }
        dmarcPhase {
          ...RequiredSummaryFields
        }
        web {
          ...RequiredSummaryFields
        }
        mail {
          ...RequiredSummaryFields
        }
      }
    }
  }
  ${Summary.fragments.requiredFields}
`

export const PAGINATED_ORG_DOMAINS = gql`
  query OrgDomainsNext(
    $slug: Slug!
    $first: Int
    $after: String
    $orderBy: DomainOrder
    $search: String
    $filters: [DomainFilter]
  ) {
    findOrganizationBySlug(orgSlug: $slug) {
      id
      domains(first: $first, after: $after, orderBy: $orderBy, search: $search, filters: $filters) {
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
              ...RequiredDomainStatusFields
            }
            hasDMARCReport
            claimTags
            hidden
            archived
            rcode
            blocked
            wildcardSibling
            webScanPending
            userHasPermission
          }
        }
      }
    }
  }
  ${Status.fragments.requiredFields}
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
  query Domains($first: Int, $after: String, $orderBy: DomainOrder, $search: String) {
    findMyDomains(first: $first, after: $after, orderBy: $orderBy, search: $search) {
      edges {
        cursor
        node {
          id
          domain
          rcode
          blocked
          wildcardSibling
          webScanPending
          status {
            ...RequiredDomainStatusFields
          }
          archived
          hasDMARCReport
          userHasPermission
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
  ${Status.fragments.requiredFields}
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
      insideUser
      receiveUpdateEmails
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
  query PaginatedDmarcReport($domain: DomainScalar!, $month: PeriodEnums!, $year: Year!, $after: String, $first: Int) {
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
    findMyDmarcSummaries(month: $month, year: $year, first: $first, after: $after, orderBy: $orderBy, search: $search) {
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
      externallyManaged
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
  query FindMyUsers($first: Int, $after: String, $orderBy: AffiliationUserOrder, $search: String) {
    findMyUsers(orderBy: $orderBy, first: $first, after: $after, search: $search) {
      edges {
        cursor
        node {
          id
          userName
          displayName
          emailValidated
          insideUser
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

export const AUDIT_LOGS = gql`
  query FindAuditLogs(
    $orgId: ID
    $first: Int!
    $after: String
    $orderBy: LogOrder!
    $search: String
    $filters: LogFilters
  ) {
    findAuditLogs(orgId: $orgId, first: $first, after: $after, orderBy: $orderBy, search: $search, filters: $filters) {
      edges {
        node {
          id
          timestamp
          initiatedBy {
            id
            userName
            role
            organization
          }
          action
          target {
            resource
            organization {
              name
            }
            resourceType
            updatedProperties {
              name
              oldValue
              newValue
            }
          }
          reason
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

export const MY_TRACKER_SUMMARY = gql`
  query FindMyTracker {
    findMyTracker {
      summaries {
        https {
          ...RequiredSummaryFields
        }
        dmarc {
          ...RequiredSummaryFields
        }
        dmarcPhase {
          ...RequiredSummaryFields
        }
      }
    }
  }
  ${Summary.fragments.requiredFields}
`

export const MY_TRACKER_DOMAINS = gql`
  query FindMyTracker($first: Int, $after: String, $orderBy: DomainOrder, $search: String) {
    findMyTracker {
      domains(orderBy: $orderBy, search: $search, first: $first, after: $after) {
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        totalCount
        edges {
          node {
            id
            domain
            hasDMARCReport
            status {
              ...RequiredDomainStatusFields
            }
            archived
            rcode
            blocked
            wildcardSibling
            webScanPending
          }
          cursor
        }
      }
    }
  }
  ${Status.fragments.requiredFields}
`
