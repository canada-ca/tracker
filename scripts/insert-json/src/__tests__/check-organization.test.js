require('dotenv').config()
const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ensure, dbNameFromFile } = require('arango-tools')
const { databaseOptions } = require('../../database-options')

const { checkOrganization } = require('../check-organization')

describe('given the checkOrganization function', () => {
  let query, drop, truncate, collections, org

  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)

  beforeAll(async () => {
    console.info = mockedInfo
    ;({ query, drop, truncate, collections } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
  })

  afterEach(async () => {
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

  describe('given the organization exists', () => {
    beforeEach(async () => {
      org = await collections.organizations.save({
        _id: 'organizations/1',
        _key: '1',
        orgDetails: {
          en: {
            acronym: 'CSE',
          },
          fr: {
            acronym: 'CST',
          },
        },
      })
    })
    it('returns the org', async () => {
      const key = 'CSE-CST'
      const data = {
        'CSE-CST': {
          acronym_en: 'CSE',
          acronym_fr: 'CST',
        },
      }

      const orgObj = await checkOrganization({ data, key, query })

      expect(orgObj).toEqual({
        _id: 'organizations/1',
        _key: '1',
        _rev: org._rev,
        orgDetails: {
          en: {
            acronym: 'CSE',
          },
          fr: {
            acronym: 'CST',
          },
        },
      })
    })
  })

  describe('given the organization does not exist', () => {
    it('returns undefined', async () => {
      const key = 'CSE-CST'
      const data = {
        'CSE-CST': {
          acronym_en: 'CSE',
          acronym_fr: 'CST',
        },
      }

      const orgObj = await checkOrganization({ data, key, query })

      expect(orgObj).toBeUndefined()
    })
  })
})
