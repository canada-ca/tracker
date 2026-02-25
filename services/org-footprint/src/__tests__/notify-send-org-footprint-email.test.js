jest.mock('../logger')

const logger = require('../logger')
const { sendOrgFootprintEmail } = require('../notify')
const { NOTIFICATION_ORG_FOOTPRINT_BILINGUAL } = process.env

describe('given the sendOrgFootprintEmail function', () => {
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

      const auditLogs = [
        {
          action: 'add',
          target: {
            resourceType: 'user',
          },
        },
        {
          action: 'add',
          target: {
            resourceType: 'user',
          },
        },
        {
          action: 'remove',
          target: {
            resource: 'domain1',
            resourceType: 'domain',
          },
        },
        {
          action: 'update',
          target: {
            resource: 'domain2',
            resourceType: 'domain',
          },
        },
      ]

      await sendOrgFootprintEmail({
        notifyClient,
        user,
        auditLogs,
        orgNames: {
          en: 'Test Org',
          fr: 'Le Test Org',
        },
      })

      expect(notifyClient.sendEmail).toHaveBeenCalledWith(NOTIFICATION_ORG_FOOTPRINT_BILINGUAL, user.userName, {
        personalisation: {
          display_name: user.displayName,
          organization_name_en: 'Test Org',
          organization_name_fr: 'Le Test Org',
          add_users_count: 2,
          update_users_count: 0,
          remove_users_count: 0,
          add_domains_count: 0,
          add_domains_list: '',
          update_domains_count: 1,
          update_domains_list: 'domain2',
          remove_domains_count: 1,
          remove_domains_list: 'domain1',
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

      await sendOrgFootprintEmail({
        notifyClient,
        user,
        auditLogs: [],
        orgNames: {
          en: 'Test Org',
          fr: 'Le Test Org',
        },
      })

      expect(logger.error).toHaveBeenCalledWith(
        {
          err: new Error('Notification error occurred.'),
          userKey: user._key,
        },
        'Error occurred when sending org footprint changes via email',
      )
    })
  })
})
