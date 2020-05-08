import { Client } from '../client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import gql from 'graphql-tag'

describe('client', () => {
  describe('queries', () => {
    describe('with a userName in the cache', () => {
      let cache

      beforeEach(() => {
        cache = new InMemoryCache()
        cache.writeData({ data: { userName: 'foo' } })
      })

      it('returns the userName', async () => {
        const GET_USERNAME = gql`
          {
            userName @client
          }
        `
        const client = new Client({ cache })
        const response = await client.query({ query: GET_USERNAME })
        expect(response.data).toMatchObject({
          userName: 'foo',
        })
      })
    })
    describe('with a userName in the cache', () => {
      let cache

      beforeEach(() => {
        cache = new InMemoryCache()
        cache.writeData({ data: { userName: 'foo' } })
      })

      it('returns the userName', async () => {
        const GET_USERNAME = gql`
          {
            userName @client
          }
        `
        const client = new Client({ cache })
        const response = await client.query({ query: GET_USERNAME })
        expect(response.data).toMatchObject({
          userName: 'foo',
        })
      })
    })
  })

  describe('mutations', () => {
    describe('with an empty cache', () => {
      let cache

      beforeEach(() => {
        cache = new InMemoryCache()
      })

      describe('userName @client', () => {
        it('sets the userName in the cache', async () => {
          const SET_USERNAME = gql`
            mutation setUserName($name: String!) {
              userName(name: $name) @client
            }
          `
          const client = new Client({ cache })
          await client.mutate({
            mutation: SET_USERNAME,
            variables: { name: 'bar' },
          })

          expect(cache.data).toMatchObject({
            data: {
              ROOT_QUERY: { userName: 'bar' },
              ROOT_MUTATION: { 'userName({"name":"bar"})': 'bar' },
            },
          })
        })
      })
    })
  })
})
