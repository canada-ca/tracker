const dotenv = require('dotenv-safe')
dotenv.config()
const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { makeMigrations } = require('../../migrations')
const { cleanseInput } = require('../validators')
const {
  domainLoaderConnectionsByOrgId,
  domainLoaderByKey,
} = require('../loaders')
const { toGlobalId } = require('graphql-relay')

describe('given the load domain connection using org id function', () => {
  let query, drop, truncate, migrate, collections, user, org, orgTwo, domain

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
    orgTwo = await collections.organizations.save({
      orgDetails: {
        en: {
          slug: 'communications-security-establishment',
          acronym: 'CSE',
          name: 'Communications Security Establishment',
          zone: 'FED',
          sector: 'DND',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
        fr: {
          slug: 'centre-de-la-securite-des-telecommunications',
          acronym: 'CST',
          name: 'Centre de la Securite des Telecommunications',
          zone: 'FED',
          sector: 'DND',
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
    await collections.affiliations.save({
      _from: orgTwo._id,
      _to: user._id,
      permission: 'user',
    })
    domain = await collections.domains.save({
      domain: 'test.domain.gc.ca',
      slug: 'test-domain-gc-ca',
    })
    await collections.claims.save({
      _from: org._id,
      _to: domain._id,
    })
    await collections.claims.save({
      _from: orgTwo._id,
      _to: domain._id,
    })
    consoleOutput = []
  })

  afterAll(async () => {
    await drop()
  })
  describe('given a successful load', () => {
    describe('using no cursor', () => {
      it('returns multiple domains', async () => {})
    })
    describe('using after cursor', () => {
      it('returns a domain', async () => {})
    })
    describe('using before cursor', () => {
      it('returns a domain', () => {})
    })
    describe('using no limit', () => {
      it('return multiple domains', async () => {})
    })
    describe('using first limit', () => {
      it('returns a domain', async () => {})
    })
    describe('using last limit', () => {
      it('returns a domain', async () => {})
    })
    describe('no organizations are found', () => {
      it('returns an empty structure', async () => {})
    })
  })
  describe('given an unsuccessful load', () => {
    describe('first and last arguments are set', () => {
      it('returns an error message', async () => {})
    })
  })
  describe('given a database error', () => {
    describe('when gathering domain keys that are claimed by orgs that the user has affiliations to', () => {
      it('returns an error message', async () => {})
    })
    describe('when gathering domains', () => {
      it('returns an error message', async () => {})
    })
  })
  describe('given a cursor error', () => {
    describe('when gathering domain keys that are claimed by orgs that the user has affiliations to', () => {
      it('returns an error message', async () => {})
    })
    describe('when gathering domains', () => {
      it('returns an error message', async () => {})
    })
  })
})
