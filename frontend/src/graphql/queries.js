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
    $isAffiliated: Boolean
  ) {
    findMyOrganizations(
      after: $after
      first: $first
      orderBy: { field: $field, direction: $direction }
      search: $search
      includeSuperAdminOrg: $includeSuperAdminOrg
      isVerified: $isVerified
      isAffiliated: $isAffiliated
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
          userHasPermission
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
      totalCount
    }
  }
`

export const FIND_ORGANIZATION_BY_SLUG = gql`
  query FindOrganizationBySlug($orgSlug: Slug!) {
    findOrganizationBySlug(orgSlug: $orgSlug) {
      id
      acronym
      name
      slug
      domainCount
      verified
      userHasPermission
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

export const GET_HISTORICAL_CHART_SUMMARIES = gql`
  query FindChartSummaries($month: PeriodEnums!, $year: Year!) {
    findChartSummaries(month: $month, year: $year) {
      date
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
  query GetAllOrganizationDomainStatuses($filters: [DomainFilter]) {
    getAllOrganizationDomainStatuses(filters: $filters)
  }
`

export const GET_TOP_25_REPORT = gql`
  query GetTop25Reports {
    getTop25Reports
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
    $orderBy: AffiliationUserOrder
    $includePending: Boolean
  ) {
    findOrganizationBySlug(orgSlug: $orgSlug) {
      id
      affiliations(first: $first, after: $after, search: $search, orderBy: $orderBy, includePending: $includePending) {
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
            claimTags(isVisible: true) {
              tagId
              label
              description
              isVisible
              ownership
            }
            assetState
            archived
            ignoreRua
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
      id
      domain
      lastRan
      rcode
      blocked
      wildcardSibling
      wildcardEntry
      webScanPending
      cveDetected
      status {
        ...RequiredDomainStatusFields
      }
      organizations(first: 20) {
        edges {
          node {
            name
            acronym
            slug
            id
            domainCount
            slug
            verified
            userHasPermission
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
            cnameRecord
            mxRecords {
              hosts {
                preference
                hostname
                addresses
              }
              warnings
              error
            }
            nsRecords {
              hostnames
              warnings
              error
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
              isPrivateIp
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

export const GUIDANCE_ADDITIONAL_FINDINGS = gql`
  query GuidanceAdditionalFindings($domain: DomainScalar!) {
    findDomainByDomain(domain: $domain) {
      id
      ignoredCves
      additionalFindings {
        timestamp
        headers
        locations {
          city
          region
          firstSeen
          lastSeen
        }
        ports {
          port
          lastPortState
          portStateFirstSeen
          portStateLastSeen
        }
        webComponents {
          webComponentCategory
          webComponentName
          webComponentVersion
          webComponentFirstSeen
          webComponentLastSeen
          webComponentCves {
            cve
          }
        }
        vulnerabilities {
          cve
          cvss3Score
          severity
          confidenceLevel
        }
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
      availableTags(sortDirection: ASC, includeGlobal: true) {
        tagId
        label
        description
      }
    }
  }
  ${Summary.fragments.requiredFields}
`

export const GET_HISTORICAL_ORG_SUMMARIES = gql`
  query GetOrgSummaries($orgSlug: Slug!, $month: PeriodEnums!, $year: Year!) {
    findOrganizationBySlug(orgSlug: $orgSlug) {
      historicalSummaries(month: $month, year: $year, sortDirection: DESC) {
        date
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
        negativeFindings(orderBy: { direction: DESC, field: TAG_COUNT }) {
          guidanceTags {
            count
          }
        }
      }
    }
  }

  ${Summary.fragments.requiredFields}
`

export const ORG_NEGATIVE_FINDINGS = gql`
  query OrgAggregatedNegativeGuidance($orgSlug: Slug!) {
    findOrganizationBySlug(orgSlug: $orgSlug) {
      summaries {
        negativeFindings(orderBy: { direction: DESC, field: TAG_COUNT }) {
          guidanceTags {
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
            count
          }
          totalCount
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
    $filters: [DomainFilter]
  ) {
    findOrganizationBySlug(orgSlug: $slug) {
      id
      domains(first: $first, after: $after, orderBy: $orderBy, search: $search, filters: $filters) {
        totalCount
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
            claimTags(isVisible: true) {
              tagId
              label
              description
              isVisible
              ownership
            }
            assetState
            archived
            rcode
            blocked
            wildcardSibling
            wildcardEntry
            webScanPending
            userHasPermission
            cveDetected
          }
        }
      }
    }
  }
  ${Status.fragments.requiredFields}
`

export const PAGINATED_ORG_AFFILIATIONS = gql`
  query OrgUsersNext($slug: Slug!, $first: Int, $after: String, $search: String, $orderBy: AffiliationUserOrder) {
    findOrganizationBySlug(orgSlug: $slug) {
      id
      affiliations(first: $first, after: $after, search: $search, orderBy: $orderBy) {
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
    $isAffiliated: Boolean
    $filters: [DomainFilter]
  ) {
    findMyDomains(
      first: $first
      after: $after
      orderBy: $orderBy
      search: $search
      isAffiliated: $isAffiliated
      filters: $filters
    ) {
      edges {
        cursor
        node {
          id
          domain
          rcode
          blocked
          wildcardSibling
          wildcardEntry
          webScanPending
          status {
            ...RequiredDomainStatusFields
          }
          archived
          hasDMARCReport
          userHasPermission
          cveDetected
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
      totalCount
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
      phoneNumber
      tfaSendMethod
      phoneValidated
      emailValidated
      insideUser
      receiveUpdateEmails
      emailUpdateOptions {
        orgFootprint
        progressReport
      }
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
    $isAffiliated: Boolean
  ) {
    findMyDmarcSummaries(
      month: $month
      year: $year
      first: $first
      after: $after
      orderBy: $orderBy
      search: $search
      isAffiliated: $isAffiliated
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
      externalId
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
          verified
          availableTags(sortDirection: ASC, includeGlobal: true) {
            tagId
            label
            description
            isVisible
          }
        }
      }
    }
    isUserAdmin
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
  query FindMyUsers($first: Int, $after: String, $orderBy: UserOrder, $search: String) {
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
      totalCount
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
      totalCount
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
            wildcardEntry
            webScanPending
          }
          cursor
        }
      }
    }
  }
  ${Status.fragments.requiredFields}
`

export const GET_ALL_VERIFIED_RUA_DOMAINS = gql`
  query GetAllVerifiedRuaDomains {
    getAllVerifiedRuaDomains
  }
`

export const FIND_ALL_TAGS = gql`
  query FindAllTags {
    findAllTags(isVisible: false) {
      tagId
      label
      description
      isVisible
      ownership
      organizations {
        id
        name
      }
    }
  }
`
