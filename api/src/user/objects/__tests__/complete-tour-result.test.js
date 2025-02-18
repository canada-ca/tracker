import { GraphQLString } from 'graphql'

import { userPersonalType } from '../user-personal'
import { completeTourResult } from '../complete-tour-result'

describe('given the completeTourResult object', () => {
  describe('testing the field definitions', () => {
    it('has a status field', () => {
      const demoType = completeTourResult.getFields()

      expect(demoType).toHaveProperty('status')
      expect(demoType.status.type).toMatchObject(GraphQLString)
    })
    it('has a user field', () => {
      const demoType = completeTourResult.getFields()

      expect(demoType).toHaveProperty('user')
      expect(demoType.user.type).toMatchObject(userPersonalType)
    })
  })

  describe('testing the field resolvers', () => {
    describe('testing the status resolver', () => {
      it('returns the resolved field', () => {
        const demoType = completeTourResult.getFields()

        expect(demoType.status.resolve({ status: 'status' })).toEqual('status')
      })
    })
    describe('testing the user resolver', () => {
      it('returns the resolved field', () => {
        const demoType = completeTourResult.getFields()

        const user = {
          userName: 'user@test.com',
          displayName: 'Test Account',
          completedTours: [
            {
              tourId: 'tour1',
              completedAt: new Date(),
            },
          ],
        }

        expect(demoType.user.resolve({ user })).toEqual(user)
      })
    })
  })
})
