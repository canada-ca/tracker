import 'isomorphic-unfetch'
import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'
import { relayStylePagination } from '@apollo/client/utilities'

export function createCache() {
  return new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          findMyDomains: relayStylePagination(),
          findMyOrganizations: relayStylePagination(),
        },
      },
      DetailTables: {
        // Explanation: https://github.com/apollographql/apollo-client/issues/6370
        // Treats DetailTables as a global singleton
        keyFields: [],
      },
    },
  })
}

export const cache = createCache()

export const client = new ApolloClient({
  link: new HttpLink({
    uri: '/graphql',
  }),
  cache,
})
