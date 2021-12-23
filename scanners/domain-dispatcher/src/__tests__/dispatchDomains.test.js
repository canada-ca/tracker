import { Database } from 'arangojs'
import { dispatchDomains } from '../dispatchDomains.js'
// https://github.com/facebook/jest/issues/9430#issuecomment-616232029
import { jest } from '@jest/globals' // support for ESM modules

const {
  DB_URL: url,
  DB_COLLECTION: collection,
  DB_NAME: databaseName,
  DB_PASS: password,
  DB_USER: username,
} = process.env

const db = new Database({ url, databaseName, auth: { username, password } })

const logger = {
  error: jest.fn(),
  info: jest.fn(),
}

describe('domain-dispatcher', () => {
  describe('dispatchDomains', () => {
    const domains = db.collection('domains')

    afterEach(async () => {
      await domains.truncate()
    })

    it('calls publish once per domain', async () => {
      const publish = jest.fn()
      await domains.save({ domain: 'cyber.gc.ca' })
      await domains.save({ domain: 'tbs-sct.gc.ca' })

      await dispatchDomains({
        db,
        publish,
        logger,
        collection,
      })

      expect(publish).toHaveBeenCalledTimes(2)
    })
  })
})
