const {createContext} = require('../create-context.js')
const {tokenize} = require('../auth')

describe('given the create context function', () => {
  describe('request authorization token is not set', () => {
    it('returns object with userKey as "NO_USER"', async () => {
      const context = await createContext({
        query: jest.fn(),
        transaction: jest.fn(),
        collections: [],
        req: {headers: {}, language: 'en'},
        res: {},
      })

      expect(context.userKey).toEqual('NO_USER')
    })
  })

  describe('request authorization token is set', () => {
    it('returns object with userKey as value', async () => {
      const context = await createContext({
        query: jest.fn(),
        transaction: jest.fn(),
        collections: [],
        req: {
          language: 'en',
          headers: {
            authorization: tokenize({parameters: {userKey: '1234'}}),
          },
        },
        res: {},
      })

      expect(context.userKey).toEqual('1234')
    })
  })
})
