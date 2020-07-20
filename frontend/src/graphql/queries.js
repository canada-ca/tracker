import { gql } from '@apollo/client'

export const WEB_AND_EMAIL_SUMMARIES = gql`
  query LandingPageSummaries {
    webSummary: demoWebSummary {
      categories {
        name
        count
        percentage
      }
      total
    }
    emailSummary: demoEmailSummary {
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
  query DmarcReportSummaryList($domainSlug: Slug!) {
    dmarcReportSummaryList(domainSlug: $domainSlug) {
      month
      year
      categoryTotals {
        fullPass
        partialPass
        fail
        total
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
        partialPass
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
        partialPass
        fail
        total
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
        partialPass
        fail
        total
      }
    }
  }
`

export const DMARC_REPORT_DETAIL_TABLES = gql`
  query DmarcReportDetailTables(
    $domainSlug: Slug!
    $period: PeriodEnums!
    $year: Year!
  ) {
    dmarcReportDetailTables(
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

export const USER_AFFILIATIONS = gql`
  query UserAffiliations {
    user {
      affiliations {
        edges {
          node {
            organization {
              id
              acronym
            }
            permission
          }
        }
      }
    }
  }
`
