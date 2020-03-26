import gql from 'graphql-tag'

const DOMAINS = gql`
  {
    domains(organization: BOC) {
      url
    }
  }
`

export default DOMAINS
