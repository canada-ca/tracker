import { Database } from 'arangojs'
import { getCursor } from '../getCursor.js'

const {
  DB_HOST: host,
  DB_PORT: port,
  DB_NAME,
  DB_COLLECTION: collectionName,
  DB_PASS: password,
  DB_USER: username,
} = process.env

const sys = new Database({
  url: `http://${host}:${port}`,
  auth: { username, password },
})

const databaseName = `${DB_NAME}-${Date.now()}`

let db, collection

describe('domain-dispatcher', () => {
  beforeAll(async () => {
    await sys.createDatabase(databaseName, {
      users: [{ username: 'root' }],
      precaptureStackTraces: true,
    })

    db = new Database({
      url: `http://${host}:${port}`,
      databaseName,
      auth: { username, password },
      precaptureStackTraces: true,
    })

    collection = db.collection(collectionName)
    await collection.create()
  })

  afterAll(async () => {
    await sys.dropDatabase(databaseName)
  })

  describe('getCursor', () => {
    afterEach(async () => {
      await collection.truncate()
    })

    describe('with 0 domains in the collection', () => {
      it('produces a cursor with a count of 0', async () => {
        const domains = db.collection(collectionName)
        const cursor = await getCursor({ db, collection: domains })
        expect(cursor.count).toEqual(0)
      })
    })

    describe('with 1 domain in the collection', () => {
      it('produces a cursor with a count of 1', async () => {
        await collection.save({ domain: 'cyber.gc.ca' })

        const cursor = await getCursor({ db, collection })
        expect(cursor.count).toEqual(1)
      })
    })
  })
})
