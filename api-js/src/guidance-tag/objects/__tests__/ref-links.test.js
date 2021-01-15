import { GraphQLString } from 'graphql'

import { refLinksType } from '../index'

describe('given the refLinksType gql object', () => {
  describe('testing its field definitions', () => {
    it('has a description field', () => {
      const demoType = refLinksType.getFields()

      expect(demoType).toHaveProperty('description')
      expect(demoType.description.type).toMatchObject(GraphQLString)
    })
    it('has a refLink field', () => {
      const demoType = refLinksType.getFields()

      expect(demoType).toHaveProperty('refLink')
      expect(demoType.refLink.type).toMatchObject(GraphQLString)
    })
  })
  describe('testing the field resolvers', () => {
    describe('testing the description resolver', () => {
      it('returns the resolved value', () => {
        const demoType = refLinksType.getFields()

        expect(
          demoType.description.resolve({ description: 'description' }),
        ).toEqual('description')
      })
    })
    describe('testing the refLink resolver', () => {
      it('returns the resolved value', () => {
        const demoType = refLinksType.getFields()

        expect(demoType.refLink.resolve({ ref_link: 'ref_link' })).toEqual(
          'ref_link',
        )
      })
    })
  })
})
