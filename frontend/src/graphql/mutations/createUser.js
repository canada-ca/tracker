import gql from 'graphql-tag'

const CREATE_USER = gql`
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
export default CREATE_USER
