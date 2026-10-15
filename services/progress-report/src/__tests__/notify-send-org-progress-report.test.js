const { NotifyClient } = require('notifications-node-client')
const logger = require('../logger')
const { sendOrgProgressReport } = require('../notify')
const { NOTIFICATION_API_KEY, NOTIFICATION_API_URL, NOTIFICATION_ORG_PROGRESS_REPORT } = process.env

const notifyResult = ({ value }) =>
  value.then(
    ({ status }) => status,
    ({ response }) => response.data,
  )

describe('given the sendOrgProgressReport function', () => {
  let notifyClient
  beforeEach(async () => {
    notifyClient = new NotifyClient(NOTIFICATION_API_URL, NOTIFICATION_API_KEY)
    jest.spyOn(notifyClient, 'sendEmail')
    jest.spyOn(logger, 'error')
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  describe('email successfully sent', () => {
    it('returns nothing', async () => {
      const user = {
        userName: 'tracker+user@tbs-sct.gc.ca',
        displayName: 'Test Account',
      }

      const orgStats = {
        httpsScore: 90.0,
        dmarcScore: 80.0,
        domainCount: 100,
        httpsScoreDiff: 5.0,
        dmarcScoreDiff: -8.0,
        domainCountDiff: 2,
        orgDetails: {
          en: {
            name: 'Org Name',
          },
          fr: {
            name: 'Nom de Org',
          },
        },
      }

      await sendOrgProgressReport({
        notifyClient,
        user,
        orgStats,
        vulnerableAssets: 0,
      })

      expect(notifyClient.sendEmail).toHaveBeenCalledWith(NOTIFICATION_ORG_PROGRESS_REPORT, user.userName, {
        personalisation: {
          display_name: user.displayName,
          org_name_en: orgStats.orgDetails.en.name,
          org_name_fr: orgStats.orgDetails.fr.name,
          https_score: '90%',
          https_score_diff: '+5%',
          dmarc_score: '80%',
          dmarc_score_diff: '-8%',
          domain_count: 100,
          domain_count_diff: '+2',
          vulnerable_domain_count: 0,
        },
      })
      expect(await notifyResult(notifyClient.sendEmail.mock.results[0])).toEqual(201)
    })
  })
  describe('an error occurs while sending email', () => {
    it('throws an error message', async () => {
      const user = {
        userName: 'not-an-email-address',
        displayName: 'Test Account',
      }
      const orgStats = {
        httpsScore: 90.0,
        dmarcScore: 80.0,
        domainCount: 100,
        httpsScoreDiff: 5.0,
        dmarcScoreDiff: -8.0,
        domainCountDiff: 2,
        orgDetails: {
          en: {
            name: 'Org Name',
          },
          fr: {
            name: 'Nom de Org',
          },
        },
      }

      await sendOrgProgressReport({
        notifyClient,
        user,
        orgStats,
      })

      expect(logger.error.mock.calls).toEqual([
        [
          { err: expect.any(Error), userKey: user._key, orgName: orgStats.orgDetails.en.name },
          'Error occurred when sending org progress report via email',
        ],
      ])
    })
  })
})
