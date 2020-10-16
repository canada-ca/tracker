const dotenv = require('dotenv-safe')
dotenv.config()
const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { makeMigrations } = require('../../migrations')
const { domainLoaderCountByOrgId } = require('../loaders')

describe('given the load domain count using org id function', () => {
  let query,
    drop,
    truncate,
    migrate,
    collections,
    user,
    org,
    domainOne,
    domainTwo

  let consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  beforeAll(async () => {
    console.error = mockedError
    console.warn = mockedWarn
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
  })

  beforeEach(async () => {
    await truncate()
    user = await collections.users.save({
      userName: 'test.account@istio.actually.exists',
      displayName: 'Test Account',
      preferredLang: 'french',
      tfaValidated: false,
      emailValidated: false,
    })
    org = await collections.organizations.save({
      orgDetails: {
        en: {
          slug: 'treasury-board-secretariat',
          acronym: 'TBS',
          name: 'Treasury Board of Canada Secretariat',
          zone: 'FED',
          sector: 'TBS',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
        fr: {
          slug: 'secretariat-conseil-tresor',
          acronym: 'SCT',
          name: 'Secrétariat du Conseil Trésor du Canada',
          zone: 'FED',
          sector: 'TBS',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
      },
    })
    await collections.affiliations.save({
      _from: org._id,
      _to: user._id,
      permission: 'user',
    })
    domainOne = await collections.domains.save({
      domain: 'test.domain.gc.ca',
      slug: 'test-domain-gc-ca',
    })
    domainTwo = await collections.domains.save({
      domain: 'test.domain.canada.ca',
      slug: 'test-domain-canada-ca',
    })
    consoleOutput = []
  })

  afterAll(async () => {
    await drop()
  })
  describe('given a successful load', () => {
    describe('org has domains', () => {
      beforeEach(async () => {
        await collections.claims.save({
          _to: domainOne._id,
          _from: org._id,
        })
        await collections.claims.save({
          _to: domainTwo._id,
          _from: org._id,
        })
      })
      afterEach(async () => {
        await query`
          LET domainEdges = (FOR v, e IN 1..1 ANY ${org._id} claims RETURN { edgeKey: e._key, userId: e._to })
          LET removeDomainEdges = (FOR domainEdge IN domainEdges REMOVE domainEdge.edgeKey IN claims)
          RETURN true
        `
        await query`
          FOR claim IN claims
            REMOVE claim IN claims
        `
      })
      it('returns domain count', async () => {
        const connectionLoader = domainLoaderCountByOrgId(
          query,
          user._key,
        )

        const domainCount = await connectionLoader({
          orgId: org._id,
        })

        expect(domainCount).toEqual(2)
      })
    })
    describe('org has no domains', () => {
      it('returns 0', async () => {
        const connectionLoader = domainLoaderCountByOrgId(
          query,
          user._key,
        )

        const domainCount = await connectionLoader({
          orgId: org._id,
        })

        expect(domainCount).toEqual(0)
      })
    })
  })
  describe('given an unsuccessful load', () => {
    describe('database error occurs', () => {
      it('returns corresponding error', async () => {
        query = jest
          .fn()
          .mockRejectedValue(
            new Error(
              'Database error occurred while loading domains. Please try again.',
            ),
          )
        const connectionLoader = domainLoaderCountByOrgId(
          query,
          user._key,
        )

        try {
          await connectionLoader({
            orgId: org._id,
          })
        } catch (err) {
          expect(err).toEqual(
            new Error(
              'Database error occurred while querying domains. Please try again.',
            ),
          )
        }

        expect(consoleOutput).toEqual([
          `Database error occurred while user: ${user._key} was trying to query affiliated domains in loadDomainCountByOrgId.`,
        ])
      })
    })
  })
})
