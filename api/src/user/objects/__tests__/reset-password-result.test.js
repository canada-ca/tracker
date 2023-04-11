import {GraphQLString} from 'graphql'

import {resetPasswordResultType} from '../reset-password-result'

describe('given the resetPasswordErrorType object', () => {
  describe('testing the field definitions', () => {
    it('has an status field', () => {
      const demoType = resetPasswordResultType.getFields()

      expect(demoType).toHaveProperty('status')
      expect(demoType.status.type).toMatchObject(GraphQLString)
    })
  })

  describe('testing the field resolvers', () => {
    describe('testing the status resolver', () => {
      it('returns the resolved field', () => {
        const demoType = resetPasswordResultType.getFields()

        expect(demoType.status.resolve({status: 'status'})).toEqual('status')
      })
    })
  })
})
