const dotenv = require('dotenv-safe')
dotenv.config()

const { JWT_KEY } = process.env

const jwt = require('jsonwebtoken')
const { tokenize, verifyToken } = require('../auth')

describe('given a set of parameters', () => {
  let consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  beforeEach(() => {
    console.info = mockedInfo
    console.warn = mockedWarn
  })

  afterEach(() => {
    consoleOutput = []
  })

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
  describe('when secret does not match', () => {
    it('raises an error', () => {
      const parameters = {
        userId: 1,
      }
      const token = jwt.sign({ parameters }, 'superSecretKey', {
        algorithm: 'HS256',
      })

      expect(() => {
        verifyToken(token)
      }).toThrow(Error('Invalid token, please sign in again.'))
      expect(consoleOutput).toEqual([
        `JWT was attempted to be verified but secret was incorrect.`,
      ])
    })
  })
})
