import 'isomorphic-unfetch'
import {
  ApolloClient,
  createHttpLink,
  InMemoryCache,
  makeVar,
  split,
} from '@apollo/client'
import {
  getMainDefinition,
  relayStylePagination,
} from '@apollo/client/utilities'
import { setContext } from '@apollo/client/link/context'
import { i18n } from '@lingui/core'
import { WebSocketLink } from '@apollo/client/link/ws'

export function createCache() {
  return new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          findMyDomains: relayStylePagination(),
          findMyDmarcSummaries: relayStylePagination(),
          findMyOrganizations: relayStylePagination(['isAdmin']),
          getOneTimeDkimScans: {
            merge(existing = [], incoming) {
              return [...existing, incoming]
            },
          },
          getOneTimeDmarcScans: {
            merge(existing = [], incoming) {
              return [...existing, incoming]
            },
          },
          getOneTimeHttpsScans: {
            merge(existing = [], incoming) {
              return [...existing, incoming]
            },
          },
          getOneTimeSslScans: {
            merge(existing = [], incoming) {
              return [...existing, incoming]
            },
          },
          getOneTimeSpfScans: {
            merge(existing = [], incoming) {
              return [...existing, incoming]
            },
          },
          getOneTimeScans: {
            merge(existing = [], incoming) {
              return [...existing, incoming]
            },
          },
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

export const currentUserVar = makeVar({
  jwt: null,
  tfaSendMethod: null,
  userName: null,
})

const httpLink = createHttpLink({
  uri:
    process.env.NODE_ENV === 'production'
      ? `https://${window.location.host}/graphql`
      : '/graphql',
})

const headersLink = setContext((_, { headers }) => {
  const language = i18n.locale

  return {
    headers: {
      ...headers,
      ...(currentUserVar().jwt && { authorization: currentUserVar().jwt }),
      'Accept-Language': language,
    },
  }
})

const httpLinkWithHeaders = headersLink.concat(httpLink)

const wsLink = new WebSocketLink({
  uri:
    process.env.NODE_ENV === 'production'
      ? `wss://${window.location.host}/graphql`
      : 'ws://localhost:3000/graphql',

  options: {
    lazy: true,
    reconnect: true,
    connectionParams: () => {
      return {
        'Accept-Language': i18n.locale,
        authorization: currentUserVar().jwt,
      }
    },
  },
})

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query)
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    )
  },
  wsLink,
  httpLinkWithHeaders,
)

export const client = new ApolloClient({
  link: splitLink,
  cache,
})
