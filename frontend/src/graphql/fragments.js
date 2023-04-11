import { gql } from '@apollo/client'

export const Authorization = {
  fragments: {
    requiredFields: gql`
      fragment RequiredAuthResultFields on AuthResult {
        authToken
        user {
          id
          userName
          tfaSendMethod
          preferredLang
          emailValidated
          insideUser
        }
      }
    `,
  },
}

export const Guidance = {
  fragments: {
    requiredFields: gql`
      fragment RequiredGuidanceTagFields on GuidanceTag {
        id
        tagId
        tagName
        guidance
        refLinks {
          description
          refLink
        }
        refLinksTech {
          description
          refLink
        }
      }
    `,
  },
}
