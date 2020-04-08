import { createHttpLink } from 'apollo-link-http'
import { ApolloClient } from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import fetch from 'isomorphic-unfetch'

const defaultResolvers = {
  Query: {
    jwt: () => null,
    tfa: () => null,
    userName: () => null,
  },
  Mutation: {
    jwt: () => null,
    tfa: () => null,
    userName: (_obj, { name }, { cache }, _info) => {
      cache.writeData({ data: { userName: name } })
      return name
    },
  },
}

export function Client({
  link = createHttpLink({ fetch }),
  cache = new InMemoryCache(),
  resolvers = defaultResolvers,
} = {}) {
  return new ApolloClient({
    link,
    cache,
    resolvers,
  })
}
