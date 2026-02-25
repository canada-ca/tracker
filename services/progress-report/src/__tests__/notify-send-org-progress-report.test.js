jest.mock('../logger')

const logger = require('../logger')
const { sendOrgProgressReport } = require('../notify')
const { NOTIFICATION_ORG_PROGRESS_REPORT } = process.env

describe('given the sendOrgProgressReport function', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
  })
  describe('email successfully sent', () => {
    it('returns nothing', async () => {
      const sendEmail = jest.fn()
      const notifyClient = {
        sendEmail,
      }
      const user = {
        userName: 'test@email.ca',
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
    })
  })
  describe('an error occurs while sending email', () => {
    it('throws an error message', async () => {
      const sendEmail = jest.fn().mockRejectedValue(new Error('Notification error occurred.'))
      const notifyClient = {
        sendEmail,
      }

      const user = {
        userName: 'test@email.ca',
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

      expect(logger.error).toHaveBeenCalledWith(
        {
          err: new Error('Notification error occurred.'),
          userKey: user._key,
          orgName: orgStats.orgDetails.en.name,
        },
        'Error occurred when sending org progress report via email',
      )
    })
  })
})
