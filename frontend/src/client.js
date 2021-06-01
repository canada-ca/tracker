import 'isomorphic-unfetch'
import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client'
import { relayStylePagination } from '@apollo/client/utilities'
import { setContext } from '@apollo/client/link/context'
import { i18n } from '@lingui/core'

export function createCache() {
  return new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          findMyDomains: relayStylePagination(['first', 'orderBy', 'search']),
          findMyDmarcSummaries: relayStylePagination([
            'first',
            'orderBy',
            'search',
            'month',
            'year',
          ]),
          findMyOrganizations: relayStylePagination([
            'first',
            'orderBy',
            'search',
          ]),
        },
      },
      Organization: {
        fields: {
          domains: relayStylePagination(['first', 'search']),
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
      Domain: {
        fields: {
          status: {
            merge(existing, incoming, { mergeObjects }) {
              return mergeObjects(existing, incoming)
            },
          },
        },
      },
    },
  })
}

export const cache = createCache()

const httpLink = createHttpLink({
  uri: 'https://tracker.alpha.canada.ca/graphql',
})

const languageLink = setContext((_, { headers }) => {
  const language = i18n.locale

  return {
    headers: {
      ...headers,
      'Accept-Language': language,
    },
  }
})

export const client = new ApolloClient({
  link: languageLink.concat(httpLink),
  cache,
})
