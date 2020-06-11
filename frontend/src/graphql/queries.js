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

export const GET_ALIGNED_BY_IP = gql`
  query GetAlignedByIp($domain: Slug!) {
    getAlignedByIp(domain: $domain) {
      source_ip_address
      dns_domain
      header_from
      envelope_from
      spf_results
      spf_aligned
      dkim_domains
      dkim_selectors
      dkim_results
      dkim_aligned
      message_count
    }
  }
`
export const GET_SPF_FAILURES = gql`
  query GetSpfFailures($domain: Slug!) {
    getSpfFailures(domain: $domain) {
      source_ip_address
      dns_domain
      envelope_from
      header_from
      spf_results
      message_count
    }
  }
`
export const GET_SPF_MISALIGN = gql`
  query GetSpfMisalign($domain: Slug!) {
    getSpfMisalign(domain: $domain) {
      source_ip_address
      dns_domain
      envelope_from
      header_from
      spf_results
      spf_aligned
      message_count
    }
  }
`
export const GET_DKIM_FAILURES = gql`
  query GetDkimFailures($domain: Slug!) {
    getDkimFailures(domain: $domain) {
      source_ip_address
      dns_domain
      envelope_from
      header_from
      dkim_domains
      dkim_selectors
      dkim_results
      message_count
    }
  }
`
export const GET_DKIM_MISALIGN = gql`
  query GetDkimMisalign($domain: Slug!) {
    getDkimMisalign(domain: $domain) {
      source_ip_address
      dns_domain
      envelope_from
      header_from
      dkim_domains
      dkim_selectors
      dkim_results
      dkim_aligned
      message_count
    }
  }
`
export const GET_DMARC_FAILURES = gql`
  query GetDmarcFailures($domain: Slug!) {
    getDmarcFailures(domain: $domain) {
      source_ip_address
      dns_domain
      envelope_from
      header_from
      spf_results
      spf_aligned
      dkim_domains
      dkim_selectors
      dkim_results
      dkim_aligned
      disposition
      message_count
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
