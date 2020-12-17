const { GraphQLNonNull, GraphQLID } = require('graphql')
const { toGlobalId } = require('graphql-relay')
const { GraphQLEmailAddress } = require('graphql-scalars')

const { userSharedType } = require('../index')

describe('given the user object', () => {
  describe('testing the field definitions', () => {
    it('has an id field', () => {
      const demoType = userSharedType.getFields()

      expect(demoType).toHaveProperty('id')
      expect(demoType.id.type).toMatchObject(GraphQLNonNull(GraphQLID))
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

        expect(demoType.id.resolve({ id: '1' })).toEqual(
          toGlobalId('users', '1'),
        )
      })
    })
    describe('testing the userName field', () => {
      it('returns the resolved value', () => {
        const demoType = userSharedType.getFields()

        expect(
          demoType.userName.resolve({ userName: 'test@email.gc.ca' }),
        ).toEqual('test@email.gc.ca')
      })
    })
  })
})
