const dotenv = require('dotenv-safe')
dotenv.config()

const { AUTHENTICATED_KEY } = process.env

const jwt = require('jsonwebtoken')
const { verifyToken } = require('../auth')

describe('given a encoded token', () => {
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
  describe('token can be decoded and verified', () => {
    it('returns the parameters', () => {
      const parameters = {
        userId: 1,
      }
      const token = jwt.sign(
        { parameters }, 
        String(AUTHENTICATED_KEY),
        {
          algorithm: 'HS256',
        },
      )

      const decoded = verifyToken({ token })
      expect(decoded.userId).toEqual(1)
    })
  })
  describe('if the secret does not match', () => {
    it('raises an error', () => {
      const parameters = {
        userId: 1,
      }
      const token = jwt.sign({ parameters }, 'superSecretKey', {
        algorithm: 'HS256',
      })

      expect(() => {
        verifyToken(token)
      }).toThrow(Error('Invalid token, please request a new one.'))
      expect(consoleOutput).toEqual([
        `JWT was attempted to be verified but secret was incorrect.`,
      ])
    })
  })
})
