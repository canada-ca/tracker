import { findAllTags } from '../find-all-tags'

describe('findAllTags', () => {
  let loadAllTags, userKey, context

  beforeEach(() => {
    loadAllTags = jest.fn()
    userKey = 'test-user'
    context = { userKey, loaders: { loadAllTags } }
  })

  it('should return tags when loadAllTags is successful', async () => {
    const tags = [
      { tagId: '1', label: 'Tag1', description: 'Description1', visible: true },
      { tagId: '2', label: 'Tag2', description: 'Description2', visible: false },
    ]
    loadAllTags.mockResolvedValue(tags)

    const result = await findAllTags.resolve(null, { isVisible: false }, context)

    expect(loadAllTags).toHaveBeenCalledWith({ isVisible: false })
    expect(result).toEqual(tags)
  })

  it('should apply visible filter when isVisible is true', async () => {
    const tags = [{ tagId: '1', label: 'Tag1', description: 'Description1', visible: true }]
    loadAllTags.mockResolvedValue(tags)

    const result = await findAllTags.resolve(null, { isVisible: true }, context)

    expect(loadAllTags).toHaveBeenCalledWith({ isVisible: true })
    expect(result).toEqual(tags)
  })

  it('should log a message when tags are successfully retrieved', async () => {
    const tags = [{ tagId: '1', label: 'Tag1', description: 'Description1', visible: true }]
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
