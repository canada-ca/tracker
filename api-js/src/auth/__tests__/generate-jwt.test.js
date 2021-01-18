import jwt from 'jsonwebtoken'
import { tokenize } from '../index'

const { AUTHENTICATED_KEY } = process.env

describe('given a token generator', () => {
  describe('given a set of parameters token can be encoded', () => {
    it('returns a valid encoded token', () => {
      const token = tokenize({ parameters: { userKey: 1 } })

      const decoded = jwt.verify(token, String(AUTHENTICATED_KEY))
      expect(decoded.parameters.userKey).toEqual(1)
    })
  })
  describe('given no parameters, token can still be encoded', () => {
    it('returns a valid encoded token', () => {
      const token = tokenize({})

      const decoded = jwt.verify(token, String(AUTHENTICATED_KEY))
      expect(decoded.parameters).toEqual({})
    })
  })
})
