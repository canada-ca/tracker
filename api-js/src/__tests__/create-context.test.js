const { createContext } = require('../create-context')
const { tokenize } = require('../auth')

describe('given the create context function', () => {
  describe('request authorization token is not set', () => {
    it('returns object with userKey as undefined', async () => {
      const context = createContext({
        context: {},
        req: { headers: { authorization: '' }, language: 'en' },
        res: {},
      })

      expect(context.userKey).toEqual(undefined)
    })
  })
  describe('request authorization token is set', () => {
    it('returns object with userKey as value', async () => {
      const token = tokenize({ parameters: { userKey: '1234' } })
      const context = createContext({
        context: {},
        req: { headers: { authorization: token }, language: 'en' },
        res: {},
      })

      expect(context.userKey).toEqual('1234')
    })
  })
  describe('connection value is set', () => {
    it('returns an object with set token', async () => {
      const token = tokenize({ parameters: { userKey: '1234' } })
      const context = await createContext({})({
        req: {},
        res: {},
        connection: { context: { authorization: token } },
      })

      expect(context.userKey).toEqual('1234')
    })
    it('returns an object with a set language', async () => {
      const context = await createContext({})({
        req: {},
        res: {},
        connection: { context: { language: 'en' } },
      })

      expect(context.request.language).toEqual('en')
    })
  })
})
