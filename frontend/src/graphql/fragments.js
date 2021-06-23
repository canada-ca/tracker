import { gql } from '@apollo/client'

export const Authorization = {
  fragments: {
    requiredFields: gql`
      fragment RequiredAuthResultFields on AuthResult {
        authToken
        refreshToken
        user {
          id
          userName
          tfaSendMethod
          preferredLang
        }
      }
    `,
  },
}
