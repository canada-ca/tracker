const { buildOrgFootprintPayload, addServiceAccountToRecipients } = require('../core/org-footprint-changes')

const log = (action, resourceType, resource = 'x') => ({ action, target: { resourceType, resource } })
const orgNames = { en: 'Org EN', fr: 'Org FR' }

describe('buildOrgFootprintPayload', () => {
  it.each([
    ['empty logs', []],
    ['only scan logs', [log('scan', 'domain'), log('scan', 'domain')]],
    ['only export logs', [log('export', 'organization')]],
    ['scan and export logs together', [log('scan', 'domain'), log('export', 'domain')]],
  ])('returns null for %s', (_name, logs) => {
    expect(buildOrgFootprintPayload({ logs, orgNames })).toBeNull()
  })

  it('counts and lists every kind of user and domain change', () => {
    const logs = [
      log('add', 'user'),
      log('add', 'user'),
      log('update', 'user'),
      log('remove', 'user'),
      log('add', 'domain', 'a.gc.ca'),
      log('update', 'domain', 'b.gc.ca'),
      log('remove', 'domain', 'c.gc.ca'),
    ]

    expect(buildOrgFootprintPayload({ logs, orgNames })).toEqual({
      organization_name_en: 'Org EN',
      organization_name_fr: 'Org FR',
      add_users_count: 2,
      update_users_count: 1,
      remove_users_count: 1,
      add_domains_count: 1,
      add_domains_list: 'a.gc.ca',
      update_domains_count: 1,
      update_domains_list: 'b.gc.ca',
      remove_domains_count: 1,
      remove_domains_list: 'c.gc.ca',
    })
  })

  it.each([
    ['add', 'add_domains_list', 'add_domains_count'],
    ['update', 'update_domains_list', 'update_domains_count'],
    ['remove', 'remove_domains_list', 'remove_domains_count'],
  ])('joins multiple %s domains with ", " in log order', (action, listKey, countKey) => {
    const logs = [log(action, 'domain', 'a.gc.ca'), log(action, 'domain', 'b.gc.ca'), log(action, 'domain', 'c.gc.ca')]

    const payload = buildOrgFootprintPayload({ logs, orgNames })

    expect(payload[listKey]).toBe('a.gc.ca, b.gc.ca, c.gc.ca')
    expect(payload[countKey]).toBe(3)
  })

  it('returns empty domain lists and zero counts for categories with no changes', () => {
    const payload = buildOrgFootprintPayload({ logs: [log('add', 'user')], orgNames })

    expect(payload).toMatchObject({
      add_users_count: 1,
      add_domains_count: 0,
      add_domains_list: '',
      update_domains_list: '',
      remove_domains_list: '',
    })
  })

  it('ignores scan and export logs when mixed with real changes', () => {
    const logs = [log('scan', 'domain', 's.gc.ca'), log('add', 'domain', 'a.gc.ca'), log('export', 'domain', 'e.gc.ca')]

    const payload = buildOrgFootprintPayload({ logs, orgNames })

    expect(payload.add_domains_count).toBe(1)
    expect(payload.add_domains_list).toBe('a.gc.ca')
    expect(payload.update_domains_count).toBe(0)
    expect(payload.remove_domains_count).toBe(0)
  })

  it('does not count changes to other resource types', () => {
    const payload = buildOrgFootprintPayload({ logs: [log('add', 'user'), log('add', 'organization')], orgNames })

    expect(payload.add_users_count).toBe(1)
    expect(payload.add_domains_count).toBe(0)
  })
})

describe('addServiceAccountToRecipients', () => {
  const users = [{ userName: 'a@gc.ca', displayName: 'A', _key: '1' }]
  const serviceAccount = 'svc@gc.ca'

  it('returns the same users when redirect is false', () => {
    expect(addServiceAccountToRecipients({ users, redirect: false, serviceAccount })).toBe(users)
  })

  it('appends the service account when redirect is true', () => {
    expect(addServiceAccountToRecipients({ users, redirect: true, serviceAccount })).toEqual([
      ...users,
      { userName: serviceAccount, displayName: 'Service Account', _key: 'service-account' },
    ])
  })

  it('returns only the service account for an empty user list when redirect is true', () => {
    expect(addServiceAccountToRecipients({ users: [], redirect: true, serviceAccount })).toEqual([
      { userName: serviceAccount, displayName: 'Service Account', _key: 'service-account' },
    ])
  })

  it('does not mutate the input array', () => {
    const input = [...users]

    addServiceAccountToRecipients({ users: input, redirect: true, serviceAccount })

    expect(input).toEqual(users)
    expect(input).toHaveLength(1)
  })
})
