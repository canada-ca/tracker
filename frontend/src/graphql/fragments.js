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
          emailValidated
          insideUser
          dismissedMessages {
            messageId
            dismissedAt
          }
          affiliations(first: 1) {
            totalCount
          }
        }
      }
    `,
  },
}

export const Summary = {
  fragments: {
    requiredFields: gql`
      fragment RequiredSummaryFields on CategorizedSummary {
        total
        categories {
          name
          count
          percentage
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

export const Status = {
  fragments: {
    requiredFields: gql`
      fragment RequiredDomainStatusFields on DomainStatus {
        certificates
        ciphers
        curves
        dkim
        dmarc
        hsts
        https
        protocols
        spf
        ssl
      }
    `,
  },
}
