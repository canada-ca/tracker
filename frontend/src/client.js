import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'

export function Client() {
  return new ApolloClient({
    link: new HttpLink({
      uri: '/graphql',
    }),
    cache: new InMemoryCache(),
  })
}
