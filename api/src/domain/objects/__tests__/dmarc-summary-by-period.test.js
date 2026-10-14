import { graphql, GraphQLSchema } from 'graphql'
import { dbNameFromFile } from 'arango-tools'
import moment from 'moment'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { createUserContextGenerator, ensureDatabase as ensure } from '../../../testUtilities'
import dbschema from '../../../../database.json'
import { createI18n } from '../../../create-i18n'
import { collectionNames } from '../../../collection-names'

const { DB_PASS: rootPass, DB_URL: url, AUTHENTICATED_KEY, HASHING_SALT } = process.env

const schema = new GraphQLSchema({
  query: createQuerySchema(),
  mutation: createMutationSchema(),
})
const consoleOutput = []
const mockedInfo = (output) => consoleOutput.push(output)
const mockedWarn = (output) => consoleOutput.push(output)
const mockedError = (output) => consoleOutput.push(output)
console.info = mockedInfo
console.warn = mockedWarn
console.error = mockedError

const i18n = createI18n('en')

const source = `
  query ($month: PeriodEnums!, $year: Year!) {
    findDomainByDomain(domain: "test.domain.gc.ca") {
      dmarcSummaryByPeriod(month: $month, year: $year) {
        month
        year
      }
    }
  }
`

const variableValues = {
  month: moment().format('MMMM').toUpperCase(),
  year: moment().format('YYYY'),
}

let db, query, drop, truncate, collections, transaction, createUserContext, domain, userContext

describe('dmarcSummaryByPeriod field', () => {
  beforeAll(async () => {
    ;({ db, query, drop, truncate, collections, transaction } = await ensure({
      variables: {
        dbname: dbNameFromFile(__filename),
        username: 'root',
        rootPassword: rootPass,
        password: rootPass,
        url,
      },
      schema: dbschema,
    }))

    createUserContext = createUserContextGenerator({
      db,
      query,
      transaction,
      collectionNames,
      i18n,
      secret: AUTHENTICATED_KEY,
      salt: HASHING_SALT,
    })
  })

  beforeEach(async () => {
    const user = await collections.users.save({
      userName: 'test.account@istio.actually.exists',
      emailValidated: true,
    })
    const org = await collections.organizations.save({
      orgDetails: {
        en: { slug: 'test-org', acronym: 'TO' },
        fr: { slug: 'org-test', acronym: 'OT' },
      },
    })
    domain = await collections.domains.save({
      domain: 'test.domain.gc.ca',
      slug: 'test-domain-gc-ca',
    })
    await collections.affiliations.save({ _from: org._id, _to: user._id, permission: 'user' })
    await collections.claims.save({ _from: org._id, _to: domain._id })
    await collections.ownership.save({ _from: org._id, _to: domain._id })

    userContext = await createUserContext({ userKey: user._key })
  })

  afterEach(async () => {
    consoleOutput.length = 0
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

  it('returns null when the domain has no summary for the period', async () => {
    const response = await graphql({ schema, source, variableValues, contextValue: userContext })

    expect(response).toEqual({
      data: {
        findDomainByDomain: {
          dmarcSummaryByPeriod: null,
        },
      },
    })
  })

  it('returns the summary when the domain has one for the period', async () => {
    const dmarcSummary = await collections.dmarcSummaries.save({
      detailTables: { dkimFailure: [], dmarcFailure: [], fullPass: [], spfFailure: [] },
      categoryTotals: { pass: 0, fail: 0, passDkimOnly: 0, passSpfOnly: 0 },
    })
    await collections.domainsToDmarcSummaries.save({
      _from: domain._id,
      _to: dmarcSummary._id,
      startDate: moment().startOf('month').format('YYYY-MM-DD'),
    })

    const response = await graphql({ schema, source, variableValues, contextValue: userContext })

    expect(response).toEqual({
      data: {
        findDomainByDomain: {
          dmarcSummaryByPeriod: {
            month: variableValues.month,
            year: moment().format('YYYY'),
          },
        },
      },
    })
  })
})
