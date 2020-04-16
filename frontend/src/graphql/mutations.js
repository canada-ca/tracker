import gql from 'graphql-tag'

export const CREATE_USER = gql`
  mutation CreateUser(
    $displayName: String!
    $userName: EmailAddress!
    $password: String!
    $confirmPassword: String!
  ) {
    createUser(
      displayName: $displayName
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

export const SIGN_IN = gql`
  mutation SignIn($userName: EmailAddress!, $password: String!) {
    signIn(userName: $userName, password: $password) {
      user {
        userName
        tfa
      }
      authToken
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
