import 'isomorphic-unfetch'
import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'
import { relayStylePagination } from '@apollo/client/utilities'

export function createCache() {
  return new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          findMyDomains: relayStylePagination(),
          findMyOrganizations: relayStylePagination(["orderBy"]),
        },
      },
      Organization: {
        fields: {
          domains: relayStylePagination(),
          affiliations: relayStylePagination(),
        },
      },
      Period: {
        keyFields: ['month', 'year', 'domain'],
        fields: {
          detailTables: {
            merge(existing = {}, incoming) {
              return { ...existing, ...incoming }
            },
          },
        },
      },
      DetailTables: {
        fields: {
          dkimFailure: relayStylePagination(),
          dmarcFailure: relayStylePagination(),
          spfFailure: relayStylePagination(),
          fullPass: relayStylePagination(),
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
