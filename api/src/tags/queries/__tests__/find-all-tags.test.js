import { findAllTags } from '../find-all-tags'

describe('findAllTags', () => {
  let loadAllTags, userRequired, verifiedRequired, checkSuperAdmin, superAdminRequired, userKey, context

  beforeEach(() => {
    loadAllTags = jest.fn()
    userRequired = jest.fn()
    verifiedRequired = jest.fn()
    checkSuperAdmin = jest.fn()
    superAdminRequired = jest.fn()
    userKey = 'test-user'
    context = {
      userKey,
      loaders: { loadAllTags },
      auth: { userRequired, verifiedRequired, checkSuperAdmin, superAdminRequired },
    }
  })

  it('should return tags when loadAllTags is successful', async () => {
    const tags = [
      { tagId: '1', label: 'Tag1', description: 'Description1', visible: true, ownership: 'global' },
      { tagId: '2', label: 'Tag2', description: 'Description2', visible: false, ownership: 'global' },
    ]
    loadAllTags.mockResolvedValue(tags)

    const result = await findAllTags.resolve(null, { isVisible: false }, context)

    expect(loadAllTags).toHaveBeenCalledWith({ isVisible: false })
    expect(result).toEqual(tags)
  })

  it('should apply visible filter when isVisible is true', async () => {
    const tags = [{ tagId: '1', label: 'Tag1', description: 'Description1', visible: true, ownership: 'global' }]
    loadAllTags.mockResolvedValue(tags)

    const result = await findAllTags.resolve(null, { isVisible: true }, context)

    expect(loadAllTags).toHaveBeenCalledWith({ isVisible: true })
    expect(result).toEqual(tags)
  })

  it('should log a message when tags are successfully retrieved', async () => {
    const tags = [{ tagId: '1', label: 'Tag1', description: 'Description1', visible: true, ownership: 'global' }]
    loadAllTags.mockResolvedValue(tags)
    console.info = jest.fn()

    await findAllTags.resolve(null, { isVisible: false }, context)

    expect(console.info).toHaveBeenCalledWith(`User: ${userKey} successfully retrieved tags.`)
  })

  it('should throw an error when loadAllTags fails', async () => {
    loadAllTags.mockRejectedValue(new Error('Load error'))

    await expect(findAllTags.resolve(null, { isVisible: false }, context)).rejects.toThrow('Load error')
  })
})
