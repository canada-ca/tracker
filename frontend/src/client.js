import { createHttpLink } from 'apollo-link-http'
import { ApolloClient } from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import fetch from 'isomorphic-unfetch'

export function Client(
  { link = createHttpLink({ fetch }), cache = new InMemoryCache() } = {},
) {
  return new ApolloClient({
    link,
    cache,
  })
}
