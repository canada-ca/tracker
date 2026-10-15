const { NotifyClient } = require('notifications-node-client')
const logger = require('../logger')
const { sendOrgFootprintEmail } = require('../notify')
const { NOTIFICATION_API_KEY, NOTIFICATION_API_URL, NOTIFICATION_ORG_FOOTPRINT_BILINGUAL } = process.env

const notifyResult = ({ value }) =>
  value.then(
    ({ status }) => status,
    ({ response }) => response.data,
  )

describe('given the sendOrgFootprintEmail function', () => {
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
      expect(await notifyResult(notifyClient.sendEmail.mock.results[0])).toEqual(201)
    })
  })
  describe('an error occurs while sending email', () => {
    it('throws an error message', async () => {
      const user = {
        userName: 'not-an-email-address',
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

      expect(logger.error.mock.calls).toEqual([
        [{ err: expect.any(Error), userKey: user._key }, 'Error occurred when sending org footprint changes via email'],
      ])
    })
  })
})
