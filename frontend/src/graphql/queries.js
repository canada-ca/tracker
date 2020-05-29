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
