const { sendOrgProgressReport } = require('../notify')
const { NOTIFICATION_ORG_PROGRESS_REPORT } = process.env

describe('given the sendOrgProgressReport function', () => {
  let consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)
  beforeAll(async () => {
    console.error = mockedError
  })
  beforeEach(async () => {
    consoleOutput = []
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
        httpsScoreDiff: 5,
        webDomainCountDiff: -7,
        dmarcScoreDiff: -8,
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
      const orgAverages = {
        httpsScoreDiffAvg: 4,
        webDomainCountDiffAvg: 7,
        dmarcScoreDiffAvg: 3,
        domainCountDiffAvg: 0,
      }
      const chartStats = {
        httpsScoreDiff: 4,
        webDomainCountDiff: 4,
        dmarcScoreDiff: 4,
        domainCountDiff: 4,
      }

      await sendOrgProgressReport({
        notifyClient,
        user,
        orgStats,
        orgAverages,
        chartStats,
      })

      expect(notifyClient.sendEmail).toHaveBeenCalledWith(NOTIFICATION_ORG_PROGRESS_REPORT, user.userName, {
        personalisation: {
          display_name: user.displayName,
          org_name_en: 'Org Name',
          org_name_fr: 'Nom de Org',
          https_score_diff: '+5',
          web_domain_count_diff: -7,
          dmarc_score_diff: -8,
          domain_count_diff: '+2',
          https_score_diff_avg: '+4',
          web_domain_count_diff_avg: '+7',
          dmarc_score_diff_avg: '+3',
          domain_count_diff_avg: 0,
          chart_https_score_diff: '+4',
          chart_web_domain_count_diff: '+4',
          chart_dmarc_score_diff: '+4',
          chart_domain_count_diff: '+4',
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
        httpsScoreDiff: 5,
        webDomainCountDiff: -7,
        dmarcScoreDiff: -8,
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
      const orgAverages = {
        httpsScoreDiffAvg: 4,
        webDomainCountDiffAvg: 7,
        dmarcScoreDiffAvg: 3,
        domainCountDiffAvg: 0,
      }
      const chartStats = {
        chartHttpsScoreDiff: 4,
        chartWebDomainCountDiff: 4,
        chartDmarcScoreDiff: 4,
        chartDomainCountDiff: 4,
      }

      await sendOrgProgressReport({
        notifyClient,
        user,
        orgStats,
        orgAverages,
        chartStats,
      })

      expect(consoleOutput).toEqual([
        `Error occurred when sending org progress report via email for ${user._key}: Error: Notification error occurred.`,
      ])
    })
  })
})
