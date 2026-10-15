const {
  DB_PASS: rootPass,
  DB_URL: url,
  NOTIFICATION_API_KEY,
  NOTIFICATION_API_URL,
  NOTIFICATION_ORG_PROGRESS_REPORT,
} = process.env

const { dbNameFromFile } = require('arango-tools')
const { NotifyClient } = require('notifications-node-client')
const { ensureDatabase: ensure } = require('../testUtilities')
const { databaseOptions } = require('../../database-options')
const logger = require('../logger')
const { progressReportService } = require('..')

const notifyResult = ({ value }) =>
  value.then(
    ({ status }) => status,
    ({ response }) => response.data,
  )

const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

describe('given the progressReportService function', () => {
  let query, drop, truncate, collections, notifyClient

  beforeAll(async () => {
    ;({ query, drop, truncate, collections } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
  })

  beforeEach(async () => {
    await truncate()
    notifyClient = new NotifyClient(NOTIFICATION_API_URL, NOTIFICATION_API_KEY)
    jest.spyOn(notifyClient, 'sendEmail')
    jest.spyOn(logger, 'warn')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  afterAll(async () => {
    await drop()
  })

  it('emails opted-in members of orgs with summaries, skipping pending users and orgs without summaries', async () => {
    const org = await collections.organizations.save({
      verified: true,
      orgDetails: { en: { name: 'Test Org' }, fr: { name: 'Le Test Org' } },
    })
    await collections.organizationSummaries.save({
      organization: org._id,
      date: daysAgo(20),
      https: { pass: 5, fail: 5, total: 10 },
      dmarc: { pass: 2, fail: 8, total: 10 },
    })
    const latest = await collections.organizationSummaries.save({
      organization: org._id,
      date: daysAgo(0),
      https: { pass: 9, fail: 3, total: 12 },
      dmarc: { pass: 6, fail: 6, total: 12 },
    })
    await query`UPDATE ${org._key} WITH { latestSummaryId: ${latest._id} } IN organizations`
    const user = await collections.users.save({
      userName: 'tracker+user@tbs-sct.gc.ca',
      displayName: 'User',
      emailUpdateOptions: { progressReport: true },
    })
    const pending = await collections.users.save({
      userName: 'tracker+pending@tbs-sct.gc.ca',
      displayName: 'Pending',
      emailUpdateOptions: { progressReport: true },
    })
    await collections.affiliations.save({ _from: org._id, _to: user._id, permission: 'user' })
    await collections.affiliations.save({ _from: org._id, _to: pending._id, permission: 'pending' })
    const domain = await collections.domains.save({ domain: 'vulnerable.test.gc.ca', cveDetected: true })
    await collections.claims.save({ _from: org._id, _to: domain._id })

    const newOrg = await collections.organizations.save({
      verified: true,
      orgDetails: { en: { name: 'New Org' }, fr: { name: 'Nouvelle Org' } },
    })
    const newOrgOwner = await collections.users.save({
      userName: 'tracker+owner@tbs-sct.gc.ca',
      displayName: 'Owner',
      emailUpdateOptions: { progressReport: true },
    })
    await collections.affiliations.save({ _from: newOrg._id, _to: newOrgOwner._id, permission: 'owner' })

    await progressReportService({ query, notifyClient })

    expect(notifyClient.sendEmail.mock.calls).toEqual([
      [
        NOTIFICATION_ORG_PROGRESS_REPORT,
        'tracker+user@tbs-sct.gc.ca',
        {
          personalisation: {
            display_name: 'User',
            org_name_en: 'Test Org',
            org_name_fr: 'Le Test Org',
            https_score: '75.0%',
            https_score_diff: '+25.0%',
            dmarc_score: '50.0%',
            dmarc_score_diff: '+30.0%',
            domain_count: 12,
            domain_count_diff: '+2',
            vulnerable_domain_count: 1,
          },
        },
      ],
    ])
    expect(await Promise.all(notifyClient.sendEmail.mock.results.map(notifyResult))).toEqual([201])
    expect(logger.warn.mock.calls).toEqual([
      [{ orgKey: newOrg._key }, 'No organization summaries found in the last 30 days'],
    ])
  })
})
