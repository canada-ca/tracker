import gql from 'graphql-tag'

const GENERATE_OTP_URL = gql`
  query GenerateOtpUrl($userName: EmailAddress!) {
    generateOtpUrl(userName: $userName)
  }
`
export default GENERATE_OTP_URL
