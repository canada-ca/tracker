const { createContext } = require('../create-context')
const { tokenize } = require('../auth')

describe('given the create context function', () => {
  describe('request authorization token is not set', () => {
    it('returns object with userId as undefined', async () => {
      const context = createContext({
        context: {},
        req: { headers: { authorization: '' } },
        res: {},
      })

      expect(context.userId).toEqual(undefined)
    })
  })
  describe('request authorization token is set', () => {
    it('returns object with userId as value', async () => {
      const token = tokenize({ parameters: { userId: '1234' } })
      const context = createContext({
        context: {},
        req: { headers: { authorization: token } },
        res: {},
      })

      expect(context.userId).toEqual({ userId: '1234' })
    })
  })
})
