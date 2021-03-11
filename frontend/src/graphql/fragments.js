import { gql } from '@apollo/client'

export const Authorization = {
  fragments: {
    requiredFields: gql`
      fragment RequiredAuthResultFields on AuthResult {
        authToken
        user {
          userName
          tfaSendMethod
          preferredLang
        }
      }
    `,
  },
}

export const UpdateUserProfileDisplayName = {
  fragments: {
    requiredFields: gql`
      fragment UpdateUserProfileFields on UpdateUserProfileResult {
        status
        user {
          id
          displayName
        }
      }
    `,
  },
}

export const UpdateUserProfileUserName = {
  fragments: {
    requiredFields: gql`
      fragment UpdateUserProfileFields on UpdateUserProfileResult {
        status
        user {
          id
          userName
        }
      }
    `,
  },
}

export const UpdateUserProfileLanguage = {
  fragments: {
    requiredFields: gql`
      fragment UpdateUserProfileFields on UpdateUserProfileResult {
        status
        user {
          id
          preferredLang
        }
      }
    `,
  },
}

export const UpdateUserProfileTfaSendMethod = {
  fragments: {
    requiredFields: gql`
      fragment UpdateUserProfileFields on UpdateUserProfileResult {
        status
        user {
          id
          tfaSendMethod
        }
      }
    `,
  },
}

export const UpdateUserProfilePhoneNumber = {
  fragments: {
    requiredFields: gql`
      fragment UpdateUserProfileFields on UpdateUserProfileResult {
        status
        user {
          id
          phoneNumber
        }
      }
    `,
  },
}
