import 'isomorphic-unfetch'
import { ApolloClient, createHttpLink, InMemoryCache, makeVar, from } from '@apollo/client'
import { onError } from '@apollo/client/link/error'
import { relayStylePagination } from '@apollo/client/utilities'
import { setContext } from '@apollo/client/link/context'
import { i18n } from '@lingui/core'
import { REFRESH_TOKENS } from './graphql/mutations'
import { RetryLink } from '@apollo/client/link/retry'

export function createCache() {
  return new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          findMyDomains: relayStylePagination(),
          findMyDmarcSummaries: relayStylePagination(),
          findMyOrganizations: relayStylePagination(['isAdmin']),
          findMyUsers: relayStylePagination(),
          findAuditLogs: relayStylePagination(),
          getOneTimeScans: {
            merge(existing = [], incoming) {
              return [...existing, incoming]
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
      Organization: {
        fields: {
          affiliations: relayStylePagination(),
          domains: relayStylePagination(),
        },
      },
      MyTrackerResult: {
        fields: {
          domains: relayStylePagination(),
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
      PersonalUser: {
        keyFields: [],
      },
      SharedUser: {
        fields: {
          affiliations: relayStylePagination(),
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

const refreshTokens = async () => {
  let currentToken = currentUserVar().jwt
  if (currentToken === null) {
    return
  }
  currentUserVar({
    jwt: null,
  })

  const { data } = await client.mutate({ mutation: REFRESH_TOKENS })
  if (data.refreshTokens.result.__typename === 'AuthResult') {
    currentUserVar({
      jwt: data.refreshTokens.result.authToken,
      ...currentUserVar(),
    })

    return data.refreshTokens.result.authToken
  }
}

const httpLink = createHttpLink({
  uri: process.env.NODE_ENV === 'production' ? `https://${window.location.host}/graphql` : '/graphql',
})

const headersLink = setContext(({ operationName }, { headers }) => {
  const language = i18n.locale
  const authorization = currentUserVar().jwt && operationName !== 'RefreshTokens' ? currentUserVar().jwt : ''
  return {
    headers: {
      ...headers,
      authorization,
      'Accept-Language': language,
    },
  }
})

const httpLinkWithHeaders = headersLink.concat(httpLink)

const errorLink = onError(({ graphQLErrors, operation, forward }) => {
  if (graphQLErrors)
    graphQLErrors.map(async ({ extensions: { code } }) => {
      if (code === 'UNAUTHENTICATED') {
        // Modify the operation context with a new token
        const oldHeaders = operation.getContext().headers
        const newToken = await refreshTokens()

        operation.setContext({
          headers: {
            ...oldHeaders,
            authorization: newToken,
          },
        })
        // Retry the request, returning the new observable
        return forward(operation)
      }
    })
})

const retryLink = new RetryLink()
const additiveLink = from([retryLink, errorLink, httpLinkWithHeaders])

export const client = new ApolloClient({
  link: additiveLink,
  cache,
})
