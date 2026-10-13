import { tagType } from '../tag'

describe('Tag.organizations', () => {
  let userRequired, verifiedRequired, checkPermission, loadOrgByKey, userKey, context

  beforeEach(() => {
    userRequired = jest.fn()
    verifiedRequired = jest.fn()
    checkPermission = jest.fn()
    loadOrgByKey = { load: jest.fn() }

    userKey = 'test-user'
    context = {
      userKey,
      auth: { userRequired, verifiedRequired, checkPermission },
      loaders: { loadOrgByKey },
    }
  })

  const resolveOrganizations = (source) => tagType.getFields().organizations.resolve(source, null, context)

  it('returns an empty list for globally-owned tags without checking any org', async () => {
    const result = await resolveOrganizations({ tagId: 'tag-1', ownership: 'global', organizations: ['org-1'] })

    expect(result).toEqual([])
    expect(loadOrgByKey.load).not.toHaveBeenCalled()
  })

  it('includes an org the user has a recognized role in (e.g. org admin/owner on their own org)', async () => {
    const org = { _key: 'org-1', _id: 'organizations/org-1', name: 'Org One' }
    loadOrgByKey.load.mockResolvedValue(org)
    checkPermission.mockResolvedValue('admin')

    const result = await resolveOrganizations({ tagId: 'tag-1', ownership: 'org', organizations: ['org-1'] })

    expect(result).toEqual([org])
  })

  it('excludes an org the user has no recognized permission in', async () => {
    const org = { _key: 'org-1', _id: 'organizations/org-1', name: 'Org One' }
    loadOrgByKey.load.mockResolvedValue(org)
    checkPermission.mockResolvedValue(null)

    const result = await resolveOrganizations({ tagId: 'tag-1', ownership: 'org', organizations: ['org-1'] })

    expect(result).toEqual([])
  })

  it('includes every org for a super_admin', async () => {
    const orgOne = { _key: 'org-1', _id: 'organizations/org-1', name: 'Org One' }
    const orgTwo = { _key: 'org-2', _id: 'organizations/org-2', name: 'Org Two' }
    loadOrgByKey.load.mockResolvedValueOnce(orgOne).mockResolvedValueOnce(orgTwo)
    checkPermission.mockResolvedValue('super_admin')

    const result = await resolveOrganizations({
      tagId: 'tag-1',
      ownership: 'org',
      organizations: ['org-1', 'org-2'],
    })

    expect(result).toEqual([orgOne, orgTwo])
  })

  it('skips organizations that no longer exist', async () => {
    loadOrgByKey.load.mockResolvedValue(undefined)

    const result = await resolveOrganizations({ tagId: 'tag-1', ownership: 'org', organizations: ['org-1'] })

    expect(result).toEqual([])
    expect(checkPermission).not.toHaveBeenCalled()
  })
})
