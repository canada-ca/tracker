import { gql } from '@apollo/client'

export const SIGN_UP = gql`
  mutation signUp(
    $displayName: String!
    $userName: EmailAddress!
    $password: String!
    $confirmPassword: String!
    $preferredLang: LanguageEnums!
    $signUpToken: String
  ) {
    signUp(
      input: {
        displayName: $displayName
        userName: $userName
        password: $password
        confirmPassword: $confirmPassword
        preferredLang: $preferredLang
        signUpToken: $signUpToken
      }
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

export const SIGN_IN = gql`
  mutation signIn(
    $userName: EmailAddress!
    $password: String!
  ) {
    signIn(
      input: {
        userName: $userName
        password: $password
      }
    ) {
      authenticateToken
      status
    }
  }
`

export const AUTHENTICATE = gql`
  mutation authenticate(
    $authenticationCode: Int!
    $authenticateToken: String!
  ) {
    authenticate(
      input: {
        authenticationCode: $authenticationCode
        authenticateToken: $authenticateToken
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

export const UPDATE_PASSWORD = gql`
  mutation UpdatePassword($input: UpdateUserPasswordInput!) {
    updatePassword(input: $input) {
      status
    }
  }
`

export const SEND_PASSWORD_RESET_LINK = gql`
  mutation SendPasswordResetLink($userName: EmailAddress!) {
    sendPasswordResetLink(userName: $userName) {
      status
    }
  }
`

export const UPDATE_USER_ROLES = gql`
  mutation UpdateUserRoles($input: UpdateUserRoleInput!) {
    updateUserRole(input: $input) {
      status
    }
  }
`

export const UPDATE_USER_PROFILE = gql`
  mutation UpdateUserProfile(
    $displayName: String
    $userName: EmailAddress
    $password: String
    $confirmPassword: String
    $preferredLang: LanguageEnums
    $currentPassword: String
  ) {
    updateUserProfile(
      input: {
        displayName: $displayName
        userName: $userName
        password: $password
        confirmPassword: $confirmPassword
        preferredLang: $preferredLang
        currentPassword: $currentPassword
      }
    ) {
      status
    }
  }
`

export default ''
