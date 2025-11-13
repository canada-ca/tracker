const { DB_PASS: rootPass, DB_URL: url } = process.env

const { dbNameFromFile } = require('arango-tools')
const { ensureDatabase: ensure } = require('../testUtilities')
const { databaseOptions } = require('../../database-options')

const { getOrgAdmins } = require('../database')

describe('given the getOrgAdmins function', () => {
  const consoleErrorOutput = []
  const consoleInfoOutput = []
  const mockedError = (output) => consoleErrorOutput.push(output)
  const mockedInfo = (output) => consoleInfoOutput.push(output)

  let query, drop, truncate, collections

  beforeAll(async () => {
    // Generate DB Items
    ;({ query, drop, truncate, collections } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
  })

  beforeEach(async () => {
    console.error = mockedError
    console.info = mockedInfo
    consoleErrorOutput.length = 0
    consoleInfoOutput.length = 0

    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

  describe('given a successful query', () => {
    // eslint-disable-next-line no-unused-vars
    let org, user, affiliation
    beforeEach(async () => {
      org = await collections.organizations.save({})
      user = await collections.users.save({
        userName: 'user@test.ca',
        insideUser: true,
        emailUpdateOptions: {
          progressReport: true,
        },
      })
      affiliation = await collections.affiliations.save({
        _from: org._id,
        _to: user._id,
        permission: 'admin',
      })
    })
    it('returns the org admins', async () => {
      const orgAdmins = await getOrgAdmins({ query, orgId: org._id })
      const expectedOrgAdmins = [
        {
          ...user,
          userName: 'user@test.ca',
          insideUser: true,
          emailUpdateOptions: {
            progressReport: true,
          },
        },
      ]
      expect(orgAdmins).toEqual(expectedOrgAdmins)
    })
  })
  describe('given an unsuccessful query', () => {
    describe('when the query fails', () => {
      it('throws an error', async () => {
        const mockQuery = jest.fn().mockRejectedValue(new Error('Database error occurred.'))
        try {
          await getOrgAdmins({ query: mockQuery })
        } catch (err) {
          expect(err).toEqual(
            new Error('Database error occurred while trying to find org admins: Error: Database error occurred.'),
          )
        }
      })
    })
    describe('when the cursor fails', () => {
      it('throws an error', async () => {
        const cursor = {
          all() {
            throw new Error('Cursor error occurred.')
          },
        }
        const mockQuery = jest.fn().mockReturnValue(cursor)
        try {
          await getOrgAdmins({ query: mockQuery })
        } catch (err) {
          expect(err).toEqual(
            new Error('Cursor error occurred while trying to find org admins: Error: Cursor error occurred.'),
          )
        }
      })
    })
  })
})
