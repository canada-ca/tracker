const dotenv = require('dotenv-safe')
dotenv.config()

const { JWT_KEY } = process.env

const jwt = require('jsonwebtoken')
const { tokenize, verifyToken } = require('../auth')

describe('given a set of parameters', () => {
  describe('token is encoded', () => {
    it('returns a vaild encoded token', () => {
      const token = tokenize({ parameters: { userId: 1 } })

      const decoded = jwt.verify(token, String(JWT_KEY))
      expect(decoded.parameters.userId).toEqual(1)
    })
  })
  describe('token can be decoded and verified', () => {
    it('returns the parameters', () => {
      const parameters = {
        userId: 1,
      }
      const token = jwt.sign({ parameters }, String(JWT_KEY), {
        algorithm: 'HS256',
      })

      const decoded = verifyToken(token)
      expect(decoded.userId).toEqual(1)
    })
  })
})
