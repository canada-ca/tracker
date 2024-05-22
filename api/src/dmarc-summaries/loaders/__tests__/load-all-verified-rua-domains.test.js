import { loadAllVerifiedRuaDomains } from '../load-all-verified-rua-domains'

describe('loadAllVerifiedRuaDomains', () => {
  let query, userKey, i18n

  beforeEach(() => {
    query = jest.fn().mockReturnValue({
      all: jest.fn().mockResolvedValue([{ key: 'org1', domains: ['domain1', 'domain2'] }]),
    })
    userKey = 'userKey'
    i18n = { _: jest.fn().mockReturnValue('error message') }
  })

  it('returns the correct data when the database query is successful', async () => {
    const loader = loadAllVerifiedRuaDomains({ query, userKey, i18n })
    const result = await loader()
    expect(result).toEqual([{ key: 'org1', domains: ['domain1', 'domain2'] }])
  })

  it('throws an error when the database query fails', async () => {
    query = jest.fn().mockImplementation(() => {
      throw new Error()
    })
    const loader = loadAllVerifiedRuaDomains({ query, userKey, i18n })
    await expect(loader()).rejects.toThrow('error message')
  })
})
