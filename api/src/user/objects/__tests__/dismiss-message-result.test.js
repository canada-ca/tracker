import { GraphQLString } from 'graphql'

import { dismissMessageResult } from '../dismiss-message-result'
import { userPersonalType } from '../user-personal'

describe('given the dismissMessageResult object', () => {
  describe('testing the field definitions', () => {
    it('has a status field', () => {
      const demoType = dismissMessageResult.getFields()

      expect(demoType).toHaveProperty('status')
      expect(demoType.status.type).toMatchObject(GraphQLString)
    })
    it('has a user field', () => {
      const demoType = dismissMessageResult.getFields()

      expect(demoType).toHaveProperty('user')
      expect(demoType.user.type).toMatchObject(userPersonalType)
    })
  })

  describe('testing the field resolvers', () => {
    describe('testing the status resolver', () => {
      it('returns the resolved field', () => {
        const demoType = dismissMessageResult.getFields()

        expect(demoType.status.resolve({ status: 'status' })).toEqual('status')
      })
    })
    describe('testing the user resolver', () => {
      it('returns the resolved field', () => {
        const demoType = dismissMessageResult.getFields()

        const user = {
          userName: 'user@test.com',
          displayName: 'Test Account',
          dismissedMessage: [
            {
              messageId: 'message1',
              dismissedAt: new Date(),
            },
          ],
        }

        expect(demoType.user.resolve({ user })).toEqual(user)
      })
    })
  })
})
