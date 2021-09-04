import { Database } from 'arangojs'
import { getCursor } from '../getCursor.js'

const {
  DB_URL: url,
  DB_NAME: databaseName,
  DB_PASSWORD: password,
  DB_USER: username,
} = process.env

const db = new Database({ url, databaseName, auth: { username, password } })


describe('domain-dispatcher', () => {
  describe('getCursor', () => {
    const domains = db.collection('domains')

    afterEach(async () => {
      await domains.truncate()
    })

    describe('with 0 domains in the collection', () => {
      it('produces a cursor with a count of 0', async () => {
        const cursor = await getCursor({ db, collection: domains })
        expect(cursor.count).toEqual(0)
      })
    })

    describe('with 1 domain in the collection', () => {
      it('produces a cursor with a count of 1', async () => {
        await domains.save({ domain: 'cyber.gc.ca' })

        const cursor = await getCursor({ db, collection: domains })
        expect(cursor.count).toEqual(1)
      })
    })
  })
})
