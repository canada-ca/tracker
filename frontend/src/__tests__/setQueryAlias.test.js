import { gql } from '@apollo/client'
import { print } from 'graphql'
import { setQueryAlias } from '../setQueryAlias'

describe('setQueryAlias', () => {
  describe('given a query with no alias', () => {
    it('adds an alias node to an AST', async () => {
      const ast = gql`
        {
          a {
            b
          }
        }
      `

      const { query, alias } = setQueryAlias({
        query: ast,
        alias: 'foo',
      })

      expect(alias).toEqual('foo')

      expect(print(query)).toEqual(
        print(gql`
          {
            foo: a {
              b
            }
          }
        `),
      )
    })
  })

  describe('given a query with an existing alias', () => {
    it('replaces the old alias', async () => {
      const ast = gql`
        {
          sasquatch: a {
            b
          }
        }
      `

      const { query, alias } = setQueryAlias({
        query: ast,
        alias: 'foo',
      })

      expect(alias).toEqual('foo')

      expect(print(query)).toEqual(
        print(gql`
          {
            foo: a {
              b
            }
          }
        `),
      )
    })
  })
})
