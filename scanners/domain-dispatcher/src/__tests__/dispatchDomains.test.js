import { Database } from 'arangojs'
import { dispatchDomains } from '../dispatchDomains.js'
// https://github.com/facebook/jest/issues/9430#issuecomment-616232029
import { jest } from '@jest/globals' // support for ESM modules

const {
  DB_HOST: host,
  DB_PORT: port,
  DB_NAME,
  DB_COLLECTION: collectionName,
  DB_PASS: password,
  DB_USER: username,
} = process.env

const sys = new Database({
  url: `${host}:${port}`,
  auth: { username, password },
})


const databaseName = `${DB_NAME}-${Date.now()}`

const logger = {
  error: jest.fn(),
  info: jest.fn(),
}

let db

describe('domain-dispatcher', () => {
  beforeAll(async () => {
    await sys.createDatabase(databaseName, {
      users: [{ username: 'root' }],
      precaptureStackTraces: true,
    })

    db = new Database({
      url: `${host}:${port}`,
      databaseName,
      auth: { username, password },
      precaptureStackTraces: true,
    })

    const collection = db.collection(collectionName)
    await collection.create()
  })

  afterAll(async () => {
    await sys.dropDatabase(databaseName)
  })

  describe('dispatchDomains', () => {
    let domains

    beforeEach(async () => {
      domains = db.collection(collectionName)
    })

    afterEach(async () => {
      await domains.truncate()
    })

    it.only('calls publish once per domain', async () => {
      const publish = jest.fn()
      await domains.save({ domain: 'cyber.gc.ca' })
      await domains.save({ domain: 'tbs-sct.gc.ca' })

      await dispatchDomains({
        db,
        publish,
        logger,
        collection: collectionName,
      })

      expect(publish).toHaveBeenCalledTimes(2)
    })
  })
})
