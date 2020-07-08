import gql from 'graphql-tag'

export const SIGN_UP = gql`
  mutation signUp(
    $displayName: String!
    $userName: EmailAddress!
    $password: String!
    $confirmPassword: String!
    $preferredLang: LanguageEnums!
  ) {
    signUp(
      displayName: $displayName
      userName: $userName
      password: $password
      confirmPassword: $confirmPassword
      preferredLang: $preferredLang
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
    authenticate(
      input: {
        userName: $userName,
        password: $password
      }
    ) {
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
    $resetToken: String!
    $password: String!
    $confirmPassword: String!
  ) {
    updatePassword(
      resetToken: $resetToken
      password: $password
      confirmPassword: $confirmPassword
    ) {
      status
    }
  }
`

export default ''
