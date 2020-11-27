import { gql } from '@apollo/client'

export const SIGN_UP = gql`
  mutation signUp(
    $displayName: String!
    $userName: EmailAddress!
    $password: String!
    $confirmPassword: String!
    $preferredLang: LanguageEnums!
    $signUpToken: String!
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

export const AUTHENTICATE = gql`
  mutation authenticate($userName: EmailAddress!, $password: String!) {
    authenticate(input: { userName: $userName, password: $password }) {
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

export const RESET_PASSWORD = gql`
  mutation ResetPassword(
    $password: String!
    $confirmPassword: String!
    $resetToken: String!
  ) {
    resetPassword(
      input: {
        password: $password
        confirmPassword: $confirmPassword
        resetToken: $resetToken
      }
    ) {
      status
    }
  }
`

export const SEND_PASSWORD_RESET_LINK = gql`
  mutation SendPasswordResetLink($userName: EmailAddress!) {
    sendPasswordResetLink(input: { userName: $userName }) {
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

export const CREATE_DOMAIN = gql`
  mutation CreateDomain($orgSlug: Slug!, $url: URL!, $selectors: Selectors) {
    createDomain(
      input: { orgSlug: $orgSlug, url: $url, selectors: $selectors }
    ) {
      status
    }
  }
`

export const REMOVE_DOMAIN = gql`
  mutation RemoveDomain($url: URL!) {
    removeDomain(input: { url: $url }) {
      status
    }
  }
`

export const UPDATE_DOMAIN = gql`
  mutation UpdateDomain(
    $currentUrl: URL!
    $updatedUrl: URL!
    $updatedSelectors: Selectors
  ) {
    updateDomain(
      input: {
        currentUrl: $currentUrl
        updatedUrl: $updatedUrl
        updatedSelectors: $updatedSelectors
      }
    ) {
      status
    }
  }
`

export const INVITE_USER_TO_ORG = gql`
  mutation InviteUserToOrg(
    $userName: EmailAddress!
    $requestedRole: RoleEnums!
    $orgSlug: Slug!
    $preferredLanguage: LanguageEnums!
  ) {
    inviteUserToOrg(
      input: {
        userName: $userName
        requestedRole: $requestedRole
        orgSlug: $orgSlug
        preferredLanguage: $preferredLanguage
      }
    ) {
      status
    }
  }
`

export const REQUEST_SCAN = gql`
  mutation RequestScan($urlSlug: Slug, $scanType: ScanTypeEnums) {
    requestScan(input: { urlSlug: $urlSlug, scanType: $scanType }) {
      status
    }
  }
`

export default ''
