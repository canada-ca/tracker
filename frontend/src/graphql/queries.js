import gql from 'graphql-tag'

export const DOMAINS = gql`
  {
    domains(first: 5) {
      edges {
        node {
          organization {
            acronym
          }
          url
        }
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

export const GET_YEARLY_REPORT = gql`
  query GetYearlyReport($domain: Slug!) {
    getYearlyReport(domain: $domain) {
      month
      category_totals {
        spf_pass_dkim_pass
        spf_fail_dkim_pass
        dmarc_fail_none
        spf_pass_dkim_fail
        dmarc_fail_quarantine
        dmarc_fail_reject
        unknown
        total
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
      dkimResult
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
