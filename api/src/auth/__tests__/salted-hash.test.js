import { saltedHash } from '../salted-hash'

describe('saltedHash()', () => {
  describe('when passed data and a salt', () => {
    it('hashses them', () => {
      const data = 'secret-data'
      const salt = 'secret-salt'

      const hashed = saltedHash(salt)(data)

      expect(hashed).toEqual('b3982ae24c3cca26431152c5ebfff694')
    })
  })
})
