const { createContext } = require('../create-context')

describe('given the create context function', () => {
  describe('request authorization token is not set', () => {
    it('returns object with userKey as undefined', async () => {
      const context = createContext({
        context: {},
        req: {
          language: 'en',
          user: {},
        },
        res: {},
      })

      expect(context.userKey).toEqual(undefined)
    })
  })
  describe('request authorization token is set', () => {
    it('returns object with userKey as value', async () => {
      const context = createContext({
        context: {},
        req: {
          language: 'en',
          user: { userKey: '1234' },
        },
        res: {},
      })

      expect(context.userKey).toEqual('1234')
    })
  })
})
