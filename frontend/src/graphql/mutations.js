import gql from 'graphql-tag'

export const SIGN_UP = gql`
  mutation signUp(
    $displayName: String!
    $userName: EmailAddress!
    $password: String!
    $confirmPassword: String!
  ) {
    signUp(
      displayName: $displayName
      userName: $userName
      password: $password
      confirmPassword: $confirmPassword
    ) {
      authResult {
          authToken
          user {
              userName
         }
      }
    }
  }
`

export const AUTHENTICATE = gql`
  mutation authenticate($userName: EmailAddress!, $password: String!) {
    authenticate(userName: $userName, password: $password) {
      authResult {
          authToken
          user {
              userName
              tfa
          }
      }
    }
  }
`

export const VALIDATE_TWO_FACTOR = gql`
  mutation ValidateTwoFactor($userName: EmailAddress!, $otpCode: String!) {
    authenticateTwoFactor(userName: $userName, otpCode: $otpCode) {
      user {
        userName
      }
    }
  }
`

export const UPDATE_PASSWORD = gql`
  mutation UpdatePassword(
    $userName: EmailAddress!
    $password: String!
    $confirmPassword: String!
  ) {
    updatePassword(
      userName: $userName
      password: $password
      confirmPassword: $confirmPassword
    ) {
      user {
        userName
      }
    }
  }
`

export default ''
