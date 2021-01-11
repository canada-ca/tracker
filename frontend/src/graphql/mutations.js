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
          tfaSendMethod
          affiliations {
            edges {
              node {
                permission
                organization {
                  acronym
                  name
                  slug
                }
              }
            }
          }
        }
      }
    }
  }
`

export const SIGN_IN = gql`
  mutation signIn($userName: EmailAddress!, $password: String!) {
    signIn(input: { userName: $userName, password: $password }) {
      result {
        ... on TFASignInResult {
          authenticateToken
          sendMethod
        }
        ... on RegularSignInResult {
          authResult {
            authToken
            user {
              userName
              tfaSendMethod
            }
          }
        }
      }
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
          tfaSendMethod
        }
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

export const UPDATE_USER_ROLE = gql`
  mutation UpdateUserRole(
    $userName: EmailAddress!
    $orgId: ID!
    $role: RoleEnums!
  ) {
    updateUserRole(input: { userName: $userName, orgId: $orgId, role: $role }) {
      status
    }
  }
`

export const UPDATE_USER_PROFILE = gql`
  mutation UpdateUserProfile(
    $displayName: String
    $userName: EmailAddress
    $preferredLang: LanguageEnums
  ) {
    updateUserProfile(
      input: {
        displayName: $displayName
        userName: $userName
        preferredLang: $preferredLang
      }
    ) {
      status
    }
  }
`

export const UPDATE_USER_PASSWORD = gql`
  mutation UpdateUserPassword(
    $currentPassword: String!
    $updatedPassword: String!
    $updatedPasswordConfirm: String!
  ) {
    updateUserPassword(
      input: {
        currentPassword: $currentPassword
        updatedPassword: $updatedPassword
        updatedPasswordConfirm: $updatedPasswordConfirm
      }
    ) {
      status
    }
  }
`

export const CREATE_DOMAIN = gql`
  mutation CreateDomain(
    $orgId: ID!
    $domain: DomainScalar!
    $selectors: [Selector]
  ) {
    createDomain(
      input: { orgId: $orgId, domain: $domain, selectors: $selectors }
    ) {
      domain {
        domain
      }
    }
  }
`

export const REMOVE_DOMAIN = gql`
  mutation RemoveDomain($domainId: ID!, $orgId: ID!) {
    removeDomain(input: { domainId: $domainId, orgId: $orgId }) {
      status
    }
  }
`

export const UPDATE_DOMAIN = gql`
  mutation UpdateDomain(
    $domainId: ID!
    $orgId: ID!
    $domain: DomainScalar
    $selectors: [Selector]
  ) {
    updateDomain(
      input: {
        domainId: $domainId
        orgId: $orgId
        domain: $domain
        selectors: $selectors
      }
    ) {
      domain {
        domain
      }
    }
  }
`

export const INVITE_USER_TO_ORG = gql`
  mutation InviteUserToOrg(
    $userName: EmailAddress!
    $requestedRole: RoleEnums!
    $orgId: ID!
    $preferredLang: LanguageEnums!
  ) {
    inviteUserToOrg(
      input: {
        userName: $userName
        requestedRole: $requestedRole
        orgId: $orgId
        preferredLang: $preferredLang
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
