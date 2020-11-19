import { gql } from '@apollo/client'

export const PAGINATED_ORGANIZATIONS = gql`
  query PaginatedOrganizations($after: String, $first: Int) {
    pagination: findMyOrganizations(after: $after, first: $first) {
      edges {
        cursor
        node {
          id
          acronym
          name
          slug
          domainCount
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

export const REVERSE_PAGINATED_ORGANIZATIONS = gql`
  query PaginatedOrganizations($before: String, $last: Int) {
    pagination: findMyOrganizations(before: $before, last: $last) {
      edges {
        cursor
        node {
          id
          acronym
          name
          slug
          domainCount
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
  query FindDomainBySlug($urlSlug: Slug!) {
    findDomainBySlug(urlSlug: $urlSlug) {
      url
      slug
      lastRan
      organization {
        name
      }
      web {
        edges {
          cursor
          node {
            id
            timestamp
            domain
            https {
              httpsGuidanceTags
            }
            ssl {
              sslGuidanceTags
            }
          }
        }
      }
      email {
        edges {
          node {
            timestamp
            domain
            dmarc {
              dmarcGuidanceTags
            }
            spf {
              spfGuidanceTags
            }
            dkim {
              selectors {
                selector
                dkimGuidanceTags
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
  query AdminPanel($orgSlug: Slug!, $number: Int, $cursor: String) {
    findOrganizationBySlug(orgSlug: $orgSlug) {
      id
      domains(first: $number, after: $cursor) {
        edges {
          node {
            id
            domain
            lastRan
          }
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
  }
`

// disabled since user list doesn't work yet (Oct-26)
// export const ADMIN_PANEL = gql`
//   query Domains($number: Int, $cursor: String, $slug: Slug!) {
//     domains: findMyDomains(first: $number, after: $cursor) {
//       edges {
//         node {
//           domain
//           lastRan
//         }
//       }
//       pageInfo {
//         endCursor
//         hasNextPage
//       }
//     }
//     userList(orgSlug: $slug) {
//       pageInfo {
//         hasNextPage
//         hasPreviousPage
//       }
//       edges {
//         node {
//           id
//           userName
//           role
//           tfa
//           displayName
//         }
//       }
//     }
//   }
// `

export const ORG_DETAILS_PAGE = gql`
  query OrgDetails($slug: Slug!) {
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
          displayName
        }
      }
    }
  }
`

export const PAGINATED_DOMAINS = gql`
  query Domains($first: Int, $after: String) {
    pagination: findMyDomains(first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          url
          slug
          lastRan
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

export const REVERSE_PAGINATED_DOMAINS = gql`
  query PaginatedDomains($last: Int, $before: String) {
    pagination: findMyDomains(last: $last, before: $before) {
      edges {
        cursor
        node {
          id
          url
          slug
          lastRan
          __typename
        }
        __typename
      }
      pageInfo {
        hasNextPage
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
          displayName
        }
      }
    }
  }
`

export const QUERY_USER = gql`
  query UserPage($userName: EmailAddress!) {
    userPage(userName: $userName) {
      userName
      tfa
      lang
      displayName
      userAffiliations {
        admin
        organization
      }
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

export const DMARC_REPORT_PAGE = gql`
  query DmarcReportPage(
    $domain: DomainScalar!
    $month: PeriodEnums!
    $year: Year!
  ) {
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

export const DMARC_REPORT_SUMMARY_TABLE = gql`
  query FindMyDomains($month: PeriodEnums!, $year: Year!) {
    findMyDomains {
      edges {
        node {
          domain
          dmarcSummaryByPeriod(month: $month, year: $year) {
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
  }
`

export const USER_AFFILIATIONS = gql`
  query UserAffiliations {
    findMe {
      affiliations {
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
