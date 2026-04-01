import { findAllTags } from '../find-all-tags'

describe('findAllTags', () => {
  let tagsAll, userRequired, verifiedRequired, checkSuperAdmin, superAdminRequired, userKey, context, cleanseInput

  beforeEach(() => {
    tagsAll = jest.fn()
    userRequired = jest.fn()
    verifiedRequired = jest.fn()
    checkSuperAdmin = jest.fn()
    superAdminRequired = jest.fn()
    cleanseInput = jest.fn()

    userKey = 'test-user'
    context = {
      userKey,
      dataSources: { tags: { all: tagsAll } },
      loaders: { loadOrgByKey: jest.fn() },
      auth: { userRequired, verifiedRequired, checkSuperAdmin, superAdminRequired },
      validators: { cleanseInput },
    }
  })

  it('should return tags when loadAllTags is successful', async () => {
    const tags = [
      { tagId: '1', label: 'Tag1', description: 'Description1', visible: true, ownership: 'global', organizations: [] },
      {
        tagId: '2',
        label: 'Tag2',
        description: 'Description2',
        visible: false,
        ownership: 'global',
        organizations: [],
      },
    ]
    tagsAll.mockResolvedValue(tags)

    const result = await findAllTags.resolve(null, { isVisible: false }, context)

    expect(tagsAll).toHaveBeenCalledWith({ isVisible: false, orgId: null })
    expect(result).toEqual(tags)
  })

  it('should apply visible filter when isVisible is true', async () => {
    const tags = [{ tagId: '1', label: 'Tag1', description: 'Description1', visible: true, ownership: 'global' }]
    tagsAll.mockResolvedValue(tags)

    const result = await findAllTags.resolve(null, { isVisible: true }, context)

    expect(tagsAll).toHaveBeenCalledWith({ isVisible: true, orgId: null })
    expect(result).toEqual(tags)
  })

  it('should log a message when tags are successfully retrieved', async () => {
    const tags = [{ tagId: '1', label: 'Tag1', description: 'Description1', visible: true, ownership: 'global' }]
    tagsAll.mockResolvedValue(tags)
    console.info = jest.fn()

    await findAllTags.resolve(null, { isVisible: false }, context)

    expect(console.info).toHaveBeenCalledWith(`User: ${userKey} successfully retrieved tags.`)
  })

  it('should throw an error when loadAllTags fails', async () => {
    tagsAll.mockRejectedValue(new Error('Load error'))

    await expect(findAllTags.resolve(null, { isVisible: false }, context)).rejects.toThrow('Load error')
  })
})
