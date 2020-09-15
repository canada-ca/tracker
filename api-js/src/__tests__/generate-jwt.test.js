const dotenv = require('dotenv-safe')
dotenv.config()

const { AUTHENTICATED_KEY } = process.env

const jwt = require('jsonwebtoken')
const { tokenize } = require('../auth')

describe('given a token generator', () => {
  describe('given a set of parameters token can be encoded', () => {
    it('returns a valid encoded token', () => {
      const token = tokenize({ parameters: { userId: 1 } })

      const decoded = jwt.verify(token, String(AUTHENTICATED_KEY))
      expect(decoded.parameters.userId).toEqual(1)
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
