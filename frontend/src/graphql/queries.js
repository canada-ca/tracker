import gql from 'graphql-tag'

export const DOMAINS = gql`
  {
    domains(organization: BOC) {
      edges {
        node {
          url
        }
      }
    }
  }
`

export const GENERATE_OTP_URL = gql`
  query GenerateOtpUrl($email: EmailAddress!) {
    generateOtpUrl(email: $email)
  }
`

export const QUERY_USERLIST = gql`
  {
    userList(organizaion: "NS") {
      organization
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
      edges {
        node {
          id
          userName
          admin
          tfa
          displayName
        }
      }
    }
  }
`

export const QUERY_USER = gql`
  query UserPage($userName: EmailAddress!) {
    userPage(userName: $userName) {
      userName
      tfa
      lang
      displayName
      userAffiliations{
        admin
        organization
      }
    }
  }
`

export const QUERY_USERLIST = gql`
  {
    user {
      affiliations {
        edges {
          node {
            organization {
              acronym
              affiliatedUsers {
                pageInfo {
                  hasNextPage
                  hasPreviousPage
                  startCursor
                  endCursor
                }
                edges {
                  node {
                    id
                    user {
                      userName
                      displayName
                      tfa
                      affiliations {
                        edges {
                          node {
                            id
                            organization {
                              acronym
                            }
                            permission
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`

export const QUERY_USER = gql`
  query User($userName: EmailAddress!) {
    user(userName: $userName) {
      userName
      displayName
      lang
    }
  }
`
