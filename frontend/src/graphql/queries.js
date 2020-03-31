import gql from 'graphql-tag'

export const DOMAINS = gql`
  {
    domains(organization: BOC) {
      url
    }
  }
`

export const GENERATE_OTP_URL = gql`
  query GenerateOtpUrl($userName: EmailAddress!) {
    generateOtpUrl(userName: $userName)
  }
`
