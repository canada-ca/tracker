import gql from 'graphql-tag'

export const DOMAINS = gql`
  query Domains($number: Int, $cursor: String) {
    domains(first: $number, after: $cursor) {
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
          admin
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

export const GET_DMARC_REPORT_BAR_GRAPH = gql`
  query GetDmarcReportBarGraph($domainSlug: Slug!) {
    getDmarcReportBarGraph(domainSlug: $domainSlug) {
      month
      year
      categoryTotals {
        dmarcFailNone
        spfFailDkimPass
        spfPassDkimPass
        spfPassDkimFail
        dmarcFailQuarantine
        dmarcFailReject
        total
      }
    }
  }
`

export const GET_DMARC_REPORT_DOUGHNUT = gql`
  query GetDmarcReportDoughnut(
    $domainSlug: Slug!
    $period: PeriodEnums!
    $year: Year!
  ) {
    getDmarcReportDoughnut(
      domainSlug: $domainSlug
      period: $period
      year: $year
    ) {
      month
      year
      categoryTotals {
        dmarcFailNone
        spfFailDkimPass
        spfPassDkimPass
        spfPassDkimFail
        dmarcFailQuarantine
        dmarcFailReject
        total
      }
    }
  }
`

export const GET_DMARC_REPORT_DETAILED_TABLES = gql`
  query GetDmarcReportDetailedTables(
    $domainSlug: Slug
    $period: PeriodEnums
    $year: Year
  ) {
    getDmarcReportDetailedTables(
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

export const QUERY_DMARC_REPORT = gql`
  query QueryDmarcReport($reportId: String!) {
    queryDmarcReport(reportId: $reportId) {
      reportId
      orgName
      endDate
      dmarcResult

      spfResult
      passDmarcPercentage
      passArcPercentage
      failDmarcPercentage
      failDkimPercentage
      failSpfPercentage
      count
      dkim {
        domain
        selector
        result
      }
      spf {
        domain
        scope
        result
      }
      source {
        ipAddress
        country
        reverseDns
        baseDomain
      }
      identifiers {
        headerFrom
      }
    }
  }
`
