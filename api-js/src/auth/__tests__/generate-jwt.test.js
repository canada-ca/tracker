import jwt from 'jsonwebtoken'
import { tokenize } from '../index'

const { AUTHENTICATED_KEY } = process.env

describe('tokenize()', () => {
  describe('when passed an object of parameters', () => {
    it('encodes them into the token', () => {
      const token = tokenize({ parameters: { userKey: 1 } })

      const decoded = jwt.verify(token, String(AUTHENTICATED_KEY))
      expect(decoded.parameters.userKey).toEqual(1)
    })
  })
})

describe('tokenize()', () => {
  describe('when no iat/exp parameters are passed', () => {
    it('expires in 1 hour (3600 seconds) by default', () => {
      const token = tokenize({secret: 'foo' })

      const decoded = jwt.verify(token, 'foo')
      expect(decoded.exp - decoded.iat).toEqual(3600)
    })
  })
})

describe('tokenize()', () => {
  describe('given no parameters', () => {
    it('returns a valid encoded token', () => {
      const token = tokenize({})

      const decoded = jwt.verify(token, String(AUTHENTICATED_KEY))
      expect(decoded.parameters).toEqual({})
    })
  })
})
