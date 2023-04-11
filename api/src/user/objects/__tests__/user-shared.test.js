import {GraphQLNonNull, GraphQLID, GraphQLString} from 'graphql'
import {toGlobalId} from 'graphql-relay'
import {GraphQLEmailAddress} from 'graphql-scalars'

import {userSharedType} from '../index'

describe('given the user object', () => {
  describe('testing the field definitions', () => {
    it('has an id field', () => {
      const demoType = userSharedType.getFields()

      expect(demoType).toHaveProperty('id')
      expect(demoType.id.type).toMatchObject(GraphQLNonNull(GraphQLID))
    })
    it('has a displayName field', () => {
      const demoType = userSharedType.getFields()

      expect(demoType).toHaveProperty('displayName')
      expect(demoType.displayName.type).toMatchObject(GraphQLString)
    })
    it('has a userName field', () => {
      const demoType = userSharedType.getFields()

      expect(demoType).toHaveProperty('userName')
      expect(demoType.userName.type).toMatchObject(GraphQLEmailAddress)
    })
  })

  describe('testing the field resolvers', () => {
    describe('testing the id resolver', () => {
      it('returns the resolved field', () => {
        const demoType = userSharedType.getFields()

        expect(demoType.id.resolve({id: '1'})).toEqual(
          toGlobalId('user', '1'),
        )
      })
    })
    describe('testing the displayName field', () => {
      it('returns the resolved value', () => {
        const demoType = userSharedType.getFields()

        expect(
          demoType.displayName.resolve({displayName: 'Display Name'}),
        ).toEqual('Display Name')
      })
    })
    describe('testing the userName field', () => {
      it('returns the resolved value', () => {
        const demoType = userSharedType.getFields()

        expect(
          demoType.userName.resolve({userName: 'test@email.gc.ca'}),
        ).toEqual('test@email.gc.ca')
      })
    })
  })
})
