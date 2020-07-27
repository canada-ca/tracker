import 'isomorphic-unfetch'
import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'
import { relayStylePagination } from '@apollo/client/utilities'

export function createCache() {
  return new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          findMyOrganizations: relayStylePagination(),
        },
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
