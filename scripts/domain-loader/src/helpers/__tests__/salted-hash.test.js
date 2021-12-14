const { saltedHash } = require('../salted-hash')

describe('saltedHash()', () => {
  describe('when passed data and a salt', () => {
    it('hashses them', () => {
      const data = 'secret-data'
      const salt = 'secret-salt'

      const hashed = saltedHash(data, salt)

      expect(hashed).toEqual('b3982ae24c3cca26431152c5ebfff694')
    })
  })
})
