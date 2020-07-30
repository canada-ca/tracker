const dotenv = require('dotenv-safe')
dotenv.config()

const { JWT_KEY } = process.env

const jwt = require('jsonwebtoken')
const { tokenize } = require('../auth')

describe('given a set of parameters token can be encoded', () => {
  it('returns a vaild encoded token', () => {
    const token = tokenize({ parameters: { userId: 1 } })

    const decoded = jwt.verify(token, String(JWT_KEY))
    expect(decoded.parameters.userId).toEqual(1)
  })
})
