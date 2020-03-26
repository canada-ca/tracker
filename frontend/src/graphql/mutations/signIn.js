import gql from 'graphql-tag'

const SIGN_IN = gql`
  mutation SignIn($userName: EmailAddress!, $password: String!) {
    signIn(userName: $userName, password: $password) {
      user {
        userName
        tfaValidated
      }
      authToken
    }
  }
`
export default SIGN_IN
