import { getAllVerifiedRuaDomains } from '../get-all-verified-rua-domains'

describe('getAllVerifiedRuaDomains', () => {
  it('should return a JSON string', async () => {
    const mockUserRequired = jest.fn().mockResolvedValue({ id: 'testUser' })
    const mockVerifiedRequired = jest.fn()
    const mockCheckSuperAdmin = jest.fn().mockResolvedValue(true)
    const mockSuperAdminRequired = jest.fn()
    const mockLoadAllVerifiedRuaDomains = jest.fn().mockResolvedValue([{ key: 'testKey', domains: 'testDomains' }])

    const result = await getAllVerifiedRuaDomains.resolve(
      {},
      {},
      {
        userKey: 'testUserKey',
        auth: {
          checkSuperAdmin: mockCheckSuperAdmin,
          userRequired: mockUserRequired,
          verifiedRequired: mockVerifiedRequired,
          superAdminRequired: mockSuperAdminRequired,
        },
        loaders: {
          loadAllVerifiedRuaDomains: mockLoadAllVerifiedRuaDomains,
        },
      },
    )

    expect(result).toBe(JSON.stringify({ testKey: 'testDomains' }, null, 4))
    expect(mockUserRequired).toHaveBeenCalled()
    expect(mockVerifiedRequired).toHaveBeenCalledWith({ user: { id: 'testUser' } })
    expect(mockCheckSuperAdmin).toHaveBeenCalled()
    expect(mockSuperAdminRequired).toHaveBeenCalledWith({ user: { id: 'testUser' }, isSuperAdmin: true })
    expect(mockLoadAllVerifiedRuaDomains).toHaveBeenCalledWith({})
  })
})
