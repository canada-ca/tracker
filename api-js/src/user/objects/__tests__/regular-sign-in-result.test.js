import { authResultType, regularSignInResult } from '../index'

describe('given the regularSignInResult object', () => {
  describe('testing the field definitions', () => {
    it('has an authResult field', () => {
      const demoType = regularSignInResult.getFields()

      expect(demoType).toHaveProperty('authResult')
      expect(demoType.authResult.type).toMatchObject(authResultType)
    })
  })

  describe('testing the field resolvers', () => {
    describe('testing the authResult resolver', () => {
      it('returns the resolved field', () => {
        const demoType = regularSignInResult.getFields()

        expect(demoType.authResult.resolve({ authResult: {} })).toEqual({})
      })
    })
  })
})
