const { buildPendingUsersPayload } = require('../core')

describe('buildPendingUsersPayload', () => {
  it.each([
    {
      name: 'maps user, org names and admin link to the template fields',
      input: {
        user: { displayName: 'Ann' },
        orgNames: { en: 'Org', fr: 'Organisation' },
        adminLink: 'https://tracker.test/admin',
      },
      expected: {
        display_name: 'Ann',
        organization_name_en: 'Org',
        organization_name_fr: 'Organisation',
        admin_link: 'https://tracker.test/admin',
      },
    },
    {
      name: 'passes user and org values through unchanged',
      input: {
        user: { displayName: '  Zoë O’Neil ' },
        orgNames: { en: 'R&D <Branch>', fr: 'Direction de l’évaluation' },
        adminLink: 'https://tracker.test/admin',
      },
      expected: {
        display_name: '  Zoë O’Neil ',
        organization_name_en: 'R&D <Branch>',
        organization_name_fr: 'Direction de l’évaluation',
        admin_link: 'https://tracker.test/admin',
      },
    },
    {
      name: 'passes the admin link through unchanged',
      input: {
        user: { displayName: 'Ann' },
        orgNames: { en: 'Org', fr: 'Organisation' },
        adminLink: 'https://other.test/a?b=c#d',
      },
      expected: {
        display_name: 'Ann',
        organization_name_en: 'Org',
        organization_name_fr: 'Organisation',
        admin_link: 'https://other.test/a?b=c#d',
      },
    },
  ])('$name', ({ input, expected }) => {
    expect(buildPendingUsersPayload(input)).toEqual(expected)
  })
})
