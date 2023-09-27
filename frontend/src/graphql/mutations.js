import { gql } from '@apollo/client'
import { Authorization } from './fragments'

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
      result {
        ... on TFASignInResult {
          authenticateToken
          sendMethod
        }
        ... on SignUpError {
          code
          description
        }
      }
    }
  }
`

export const SIGN_IN = gql`
  mutation signIn($userName: EmailAddress!, $password: String!, $rememberMe: Boolean) {
    signIn(input: { userName: $userName, password: $password, rememberMe: $rememberMe }) {
      result {
        ... on TFASignInResult {
          authenticateToken
          sendMethod
        }
        ... on AuthResult {
          ...RequiredAuthResultFields
        }
        ... on SignInError {
          code
          description
        }
      }
    }
  }
  ${Authorization.fragments.requiredFields}
`

export const AUTHENTICATE = gql`
  mutation authenticate($sendMethod: String!, $authenticationCode: Int!, $authenticateToken: String!) {
    authenticate(
      input: { sendMethod: $sendMethod, authenticationCode: $authenticationCode, authenticateToken: $authenticateToken }
    ) {
      result {
        ... on AuthResult {
          ...RequiredAuthResultFields
        }
        ... on AuthenticateError {
          code
          description
        }
      }
    }
  }
  ${Authorization.fragments.requiredFields}
`

export const RESET_PASSWORD = gql`
  mutation ResetPassword($password: String!, $confirmPassword: String!, $resetToken: String!) {
    resetPassword(input: { password: $password, confirmPassword: $confirmPassword, resetToken: $resetToken }) {
      result {
        ... on ResetPasswordError {
          code
          description
        }
        ... on ResetPasswordResult {
          status
        }
      }
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
  mutation UpdateUserRole($userName: EmailAddress!, $orgId: ID!, $role: RoleEnums!) {
    updateUserRole(input: { userName: $userName, orgId: $orgId, role: $role }) {
      result {
        ... on UpdateUserRoleResult {
          status
        }
        ... on AffiliationError {
          code
          description
        }
      }
    }
  }
`

export const UPDATE_USER_PROFILE = gql`
  mutation UpdateUserProfile(
    $displayName: String
    $userName: EmailAddress
    $preferredLang: LanguageEnums
    $tfaSendMethod: TFASendMethodEnum
    $insideUser: Boolean
    $receiveUpdateEmails: Boolean
  ) {
    updateUserProfile(
      input: {
        displayName: $displayName
        userName: $userName
        preferredLang: $preferredLang
        tfaSendMethod: $tfaSendMethod
        insideUser: $insideUser
        receiveUpdateEmails: $receiveUpdateEmails
      }
    ) {
      result {
        ... on UpdateUserProfileResult {
          status
          user {
            id
            displayName
            userName
            preferredLang
            tfaSendMethod
            insideUser
            receiveUpdateEmails
          }
        }
        ... on UpdateUserProfileError {
          code
          description
        }
      }
    }
  }
`

export const UPDATE_USER_PASSWORD = gql`
  mutation UpdateUserPassword($currentPassword: String!, $updatedPassword: String!, $updatedPasswordConfirm: String!) {
    updateUserPassword(
      input: {
        currentPassword: $currentPassword
        updatedPassword: $updatedPassword
        updatedPasswordConfirm: $updatedPasswordConfirm
      }
    ) {
      result {
        ... on UpdateUserPasswordResultType {
          status
        }
        ... on UpdateUserPasswordError {
          code
          description
        }
      }
    }
  }
`

export const CREATE_DOMAIN = gql`
  mutation CreateDomain(
    $orgId: ID!
    $domain: DomainScalar!
    $selectors: [Selector]
    $tags: [InputTag]
    $archived: Boolean
    $hidden: Boolean
    $outsideComment: OutsideDomainCommentEnum
  ) {
    createDomain(
      input: {
        orgId: $orgId
        domain: $domain
        selectors: $selectors
        tags: $tags
        archived: $archived
        hidden: $hidden
        outsideComment: $outsideComment
      }
    ) {
      result {
        ... on Domain {
          id
          domain
          lastRan
          selectors
          claimTags
          hidden
          archived
          rcode
        }
        ... on DomainError {
          code
          description
        }
      }
    }
  }
`

export const REMOVE_DOMAIN = gql`
  mutation RemoveDomain($domainId: ID!, $orgId: ID!, $reason: DomainRemovalReasonEnum!) {
    removeDomain(input: { domainId: $domainId, orgId: $orgId, reason: $reason }) {
      result {
        ... on DomainResult {
          status
          domain {
            id
          }
        }
        ... on DomainError {
          code
          description
        }
      }
    }
  }
`

export const REMOVE_USER_FROM_ORG = gql`
  mutation RemoveUserFromOrg($userId: ID!, $orgId: ID!) {
    removeUserFromOrg(input: { userId: $userId, orgId: $orgId }) {
      result {
        ... on AffiliationError {
          code
          description
        }
        ... on RemoveUserFromOrgResult {
          status
          user {
            userName
          }
        }
      }
    }
  }
`

export const LEAVE_ORG = gql`
  mutation LeaveOrganization($orgId: ID!) {
    leaveOrganization(input: { orgId: $orgId }) {
      result {
        ... on AffiliationError {
          code
          description
        }
        ... on LeaveOrganizationResult {
          status
        }
      }
    }
  }
`

export const UPDATE_DOMAIN = gql`
  mutation UpdateDomain(
    $domainId: ID!
    $orgId: ID!
    $domain: DomainScalar
    $selectors: [Selector]
    $tags: [InputTag]
    $archived: Boolean
    $hidden: Boolean
    $outsideComment: OutsideDomainCommentEnum
  ) {
    updateDomain(
      input: {
        domainId: $domainId
        orgId: $orgId
        domain: $domain
        selectors: $selectors
        tags: $tags
        archived: $archived
        hidden: $hidden
        outsideComment: $outsideComment
      }
    ) {
      result {
        ... on Domain {
          id
          domain
          lastRan
          selectors
          claimTags
          hidden
          archived
          rcode
        }
        ... on DomainError {
          code
          description
        }
      }
    }
  }
`

export const INVITE_USER_TO_ORG = gql`
  mutation InviteUserToOrg($userName: EmailAddress!, $requestedRole: InvitationRoleEnums!, $orgId: ID!) {
    inviteUserToOrg(input: { userName: $userName, requestedRole: $requestedRole, orgId: $orgId }) {
      result {
        ... on InviteUserToOrgResult {
          status
        }
        ... on AffiliationError {
          code
          description
        }
      }
    }
  }
`

export const REQUEST_SCAN = gql`
  mutation RequestScan($domainUrl: DomainScalar) {
    requestScan(input: { domain: $domainUrl }) {
      status
    }
  }
`

export const SET_PHONE_NUMBER = gql`
  mutation SetPhoneNumber($phoneNumber: PhoneNumber!) {
    setPhoneNumber(input: { phoneNumber: $phoneNumber }) {
      result {
        ... on SetPhoneNumberResult {
          status
          user {
            id
            phoneNumber
            phoneValidated
            tfaSendMethod
          }
        }
        ... on SetPhoneNumberError {
          code
          description
        }
      }
    }
  }
`

export const VERIFY_PHONE_NUMBER = gql`
  mutation VerifyPhoneNumber($twoFactorCode: Int!) {
    verifyPhoneNumber(input: { twoFactorCode: $twoFactorCode }) {
      result {
        ... on VerifyPhoneNumberResult {
          status
          user {
            id
            phoneNumber
            phoneValidated
          }
        }
        ... on VerifyPhoneNumberError {
          code
          description
        }
      }
    }
  }
`

export const SEND_EMAIL_VERIFICATION = gql`
  mutation SendEmailVerification($userName: EmailAddress!) {
    sendEmailVerification(input: { userName: $userName }) {
      status
    }
  }
`

export const VERIFY_ACCOUNT = gql`
  mutation VerifyAccount($verifyToken: String!) {
    verifyAccount(input: { verifyTokenString: $verifyToken }) {
      result {
        ... on VerifyAccountResult {
          status
        }
        ... on VerifyAccountError {
          code
          description
        }
      }
    }
  }
`

export const CLOSE_ACCOUNT_OTHER = gql`
  mutation CloseAccountOther($userId: ID) {
    closeAccountOther(input: { userId: $userId }) {
      result {
        ... on CloseAccountError {
          code
          description
        }
        ... on CloseAccountResult {
          status
        }
      }
    }
  }
`

export const CLOSE_ACCOUNT_SELF = gql`
  mutation CloseAccountSelf($userId: ID) {
    closeAccountSelf(input: {}) {
      result {
        ... on CloseAccountError {
          code
          description
        }
        ... on CloseAccountResult {
          status
        }
      }
    }
  }
`

export const CREATE_ORGANIZATION = gql`
  mutation CreateOrganization(
    $acronymEN: Acronym!
    $acronymFR: Acronym!
    $nameEN: String!
    $nameFR: String!
    $zoneEN: String!
    $zoneFR: String!
    $sectorEN: String!
    $sectorFR: String!
    $countryEN: String!
    $countryFR: String!
    $provinceEN: String!
    $provinceFR: String!
    $cityEN: String!
    $cityFR: String!
  ) {
    createOrganization(
      input: {
        acronymEN: $acronymEN
        acronymFR: $acronymFR
        nameEN: $nameEN
        nameFR: $nameFR
        zoneEN: $zoneEN
        zoneFR: $zoneFR
        sectorEN: $sectorEN
        sectorFR: $sectorFR
        countryEN: $countryEN
        countryFR: $countryFR
        provinceEN: $provinceEN
        provinceFR: $provinceFR
        cityEN: $cityEN
        cityFR: $cityFR
      }
    ) {
      result {
        ... on Organization {
          name
        }
        ... on OrganizationError {
          code
          description
        }
      }
    }
  }
`

export const REMOVE_ORGANIZATION = gql`
  mutation RemoveOrganization($orgId: ID!) {
    removeOrganization(input: { orgId: $orgId }) {
      result {
        ... on OrganizationResult {
          status
          organization {
            id
            name
          }
        }
        ... on OrganizationError {
          code
          description
        }
      }
    }
  }
`

export const UPDATE_ORGANIZATION = gql`
  mutation UpdateOrganization(
    $id: ID!
    $acronymEN: Acronym
    $acronymFR: Acronym
    $nameEN: String
    $nameFR: String
    $zoneEN: String
    $zoneFR: String
    $sectorEN: String
    $sectorFR: String
    $countryEN: String
    $countryFR: String
    $provinceEN: String
    $provinceFR: String
    $cityEN: String
    $cityFR: String
  ) {
    updateOrganization(
      input: {
        id: $id
        acronymEN: $acronymEN
        acronymFR: $acronymFR
        nameEN: $nameEN
        nameFR: $nameFR
        zoneEN: $zoneEN
        zoneFR: $zoneFR
        sectorEN: $sectorEN
        sectorFR: $sectorFR
        countryEN: $countryEN
        countryFR: $countryFR
        provinceEN: $provinceEN
        provinceFR: $provinceFR
        cityEN: $cityEN
        cityFR: $cityFR
      }
    ) {
      result {
        ... on Organization {
          id
          acronym
          name
          slug
          zone
          sector
          country
          province
          city
        }
        ... on OrganizationError {
          code
          description
        }
      }
    }
  }
`

export const REFRESH_TOKENS = gql`
  mutation RefreshTokens {
    refreshTokens(input: {}) {
      result {
        ... on AuthResult {
          ...RequiredAuthResultFields
        }
        ... on AuthenticateError {
          code
          description
        }
      }
    }
  }
  ${Authorization.fragments.requiredFields}
`

export const SIGN_OUT = gql`
  mutation SignOut {
    signOut(input: {}) {
      status
    }
  }
`

export const FAVOURITE_DOMAIN = gql`
  mutation FavouriteDomain($domainId: ID!) {
    favouriteDomain(input: { domainId: $domainId }) {
      result {
        ... on Domain {
          domain
        }
        ... on DomainError {
          code
          description
        }
      }
    }
  }
`

export const UNFAVOURITE_DOMAIN = gql`
  mutation ($domainId: ID!) {
    unfavouriteDomain(input: { domainId: $domainId }) {
      result {
        ... on DomainResult {
          status
        }
        ... on DomainError {
          code
          description
        }
      }
    }
  }
`

export const ADD_ORGANIZATIONS_DOMAINS = gql`
  mutation AddOrganizationsDomains(
    $orgId: ID!
    $domains: [DomainScalar]!
    $hideNewDomains: Boolean
    $tagNewDomains: Boolean
    $audit: Boolean
  ) {
    addOrganizationsDomains(
      input: {
        orgId: $orgId
        domains: $domains
        hideNewDomains: $hideNewDomains
        tagNewDomains: $tagNewDomains
        audit: $audit
      }
    ) {
      result {
        ... on DomainBulkResult {
          status
        }
        ... on DomainError {
          code
          description
        }
      }
    }
  }
`

export const REMOVE_ORGANIZATIONS_DOMAINS = gql`
  mutation RemoveOrganizationsDomains(
    $orgId: ID!
    $domains: [DomainScalar]!
    $archiveDomains: Boolean
    $audit: Boolean
  ) {
    removeOrganizationsDomains(
      input: { orgId: $orgId, domains: $domains, archiveDomains: $archiveDomains, audit: $audit }
    ) {
      result {
        ... on DomainBulkResult {
          status
        }
        ... on DomainError {
          code
          description
        }
      }
    }
  }
`

export const REQUEST_INVITE_TO_ORG = gql`
  mutation RequestInviteToOrg($orgId: ID!) {
    requestOrgAffiliation(input: { orgId: $orgId }) {
      result {
        ... on InviteUserToOrgResult {
          status
        }
        ... on AffiliationError {
          code
          description
        }
      }
    }
  }
`

export const REQUEST_DISCOVERY = gql`
  mutation RequestDiscovery($domainUrl: DomainScalar!, $orgId: ID!) {
    requestDiscovery(input: { domain: $domainUrl, orgId: $orgId }) {
      ... on RequestDiscoveryPayload {
        status
      }
    }
  }
`

export default ''
