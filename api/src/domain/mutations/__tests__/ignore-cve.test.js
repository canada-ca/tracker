import { graphql, GraphQLError, GraphQLSchema } from 'graphql'
import { toGlobalId } from 'graphql-relay'
import { createMutationSchema } from '../../../mutation'
import { createUserContextGenerator, ensureDatabase as ensure } from '../../../testUtilities'
import { dbNameFromFile } from 'arango-tools'
import dbschema from '../../../../../database-migration/database.json'
import { createQuerySchema } from '../../../query'
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

let db,
  query,
  drop,
  truncate,
  collections,
  transaction,
  createUserContext,
  domain,
  superAdminUser,
  superAdminContext,
  normalUser,
  normalUserContext

describe('ignoreCve mutation', () => {
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
    superAdminUser = (
      await collections.users.save(
        {
          _key: 'superadminuser',
          userName: 'sueradminuser@test.gc.ca',
          emailValidated: true,
        },
        { returnNew: true },
      )
    ).new
    superAdminContext = await createUserContext({ userKey: superAdminUser._key })
    normalUser = (
      await collections.users.save(
        {
          _key: 'normaluser',
          userName: 'normaluser@test.gc.ca',
          emailValidated: true,
        },
        { returnNew: true },
      )
    ).new
    normalUserContext = await createUserContext({ userKey: normalUser._key })

    const superAdminOrg = (
      await collections.organizations.save(
        {
          _key: 'superadminorg',
          orgDetails: {
            en: {
              slug: 'super-admin',
              acronym: 'SA',
            },
            fr: {
              slug: 'super-admin',
              acronym: 'SA',
            },
          },
        },
        { returnNew: true },
      )
    ).new
    await collections.affiliations.save(
      {
        _from: superAdminOrg._id,
        _to: superAdminUser._id,
        permission: 'super_admin',
      },
      { returnNew: true },
    )

    domain = (
      await collections.domains.save(
        {
          _key: '123',
          domain: 'test.domain.gc.ca',
          slug: 'test-domain-gc-ca',
        },
        { returnNew: true },
      )
    ).new
  })

  afterEach(async () => {
    consoleOutput.length = 0
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

  it('returns an error when the user is not a super admin', async () => {
    const response = await graphql({
      schema,
      source: `
        mutation {
          ignoreCve(input: { domainId: "${toGlobalId('domain', domain._key)}", ignoredCve: "CVE-1234-55555" }) {
            result {
              ... on DomainError {
                code
                description
              }
            }
          }
        }`,
      rootValue: null,
      contextValue: normalUserContext,
    })

    const expectedError = 'Permissions error. You do not have sufficient permissions to access this data.'
    expect(response.errors[0].message).toEqual(expectedError)

    const expectConsoleOutput = [
      `User: ${normalUser._key} attempted to access controlled functionality without sufficient privileges.`,
    ]
    expect(consoleOutput).toEqual(expectConsoleOutput)
  })

  describe('given a super admin user', () => {
    it('returns an error when the domain does not exist', async () => {
      const badDomainKey = 'bad-domain-key'
      const cve = 'CVE-1234-55555'
      const response = await graphql({
        schema,
        source: `
        mutation {
          ignoreCve(input: { domainId: "${toGlobalId('domain', badDomainKey)}", ignoredCve: "${cve}" }) {
            result {
              ... on DomainError {
                code
                description
              }
            }
          }
        }`,
        rootValue: null,
        contextValue: superAdminContext,
      })

      const expectedError = {
        code: 400,
        description: 'Unable to ignore CVE. Please try again.',
      }
      expect(response.data.ignoreCve.result).toEqual(expectedError)

      const expectConsoleOutput = [
        `User: "${superAdminUser._key}" attempted to ignore CVE "${cve}" on unknown domain: "${badDomainKey}".`,
      ]
      expect(consoleOutput).toEqual(expectConsoleOutput)
    })

    it('returns an error when the CVE is already ignored', async () => {
      const cve = 'CVE-1234-55555'
      // Add the CVE to the domain's ignoredCves array
      await query`
        UPDATE {
          _key: ${domain._key},
          ignoredCves: ${[cve]}
        } IN domains
      `
      const response = await graphql({
        schema,
        source: `
        mutation {
          ignoreCve(input: { domainId: "${toGlobalId('domain', domain._key)}", ignoredCve: "${cve}" }) {
            result {
              ... on DomainError {
                code
                description
              }
            }
          }
        }`,
        rootValue: null,
        contextValue: superAdminContext,
      })

      const expectedError = {
        code: 400,
        description: 'CVE is already ignored for this domain.',
      }
      expect(response.data.ignoreCve.result).toEqual(expectedError)

      const expectConsoleOutput = [
        `User: "${superAdminUser._key}" attempted to ignore CVE "${cve}" on domain: "${domain._key}" however CVE is already ignored.`,
      ]
      expect(consoleOutput).toEqual(expectConsoleOutput)
    })

    it('throws an error when the transaction step fails', async () => {
      const cve = 'CVE-1234-55555'
      superAdminContext.transaction = jest.fn().mockReturnValue({
        step: jest.fn().mockRejectedValue(new Error('Transaction step error')),
        abort: jest.fn(),
      })

      const response = await graphql({
        schema,
        source: `
        mutation {
          ignoreCve(input: { domainId: "${toGlobalId('domain', domain._key)}", ignoredCve: "${cve}" }) {
            result {
              ... on DomainError {
                code
                description
              }
            }
          }
        }`,
        rootValue: null,
        contextValue: superAdminContext,
      })

      const error = [new GraphQLError('Unable to ignore CVE. Please try again.')]
      expect(response.errors).toEqual(error)

      const expectConsoleOutput = [
        `Transaction step error occurred when user: "${superAdminUser._key}" attempted to ignore CVE "${cve}" on domain "${domain._key}", error: Error: Transaction step error`,
      ]
      expect(consoleOutput).toEqual(expectConsoleOutput)
    })

    it('throws an error when the transaction commit fails', async () => {
      const cve = 'CVE-1234-55555'
      superAdminContext.transaction = jest.fn().mockReturnValue({
        step: jest.fn().mockReturnValue(),
        commit: jest.fn().mockRejectedValue(new Error('Transaction commit error')),
        abort: jest.fn(),
      })

      const response = await graphql({
        schema,
        source: `
        mutation {
          ignoreCve(input: { domainId: "${toGlobalId('domain', domain._key)}", ignoredCve: "${cve}" }) {
            result {
              ... on DomainError {
                code
                description
              }
            }
          }
        }`,
        rootValue: null,
        contextValue: superAdminContext,
      })

      const error = [new GraphQLError('Unable to ignore CVE. Please try again.')]
      expect(response.errors).toEqual(error)

      const expectConsoleOutput = [
        `Transaction commit error occurred when user: "${superAdminUser._key}" attempted to ignore CVE "${cve}" on domain "${domain._key}", error: Error: Transaction commit error`,
      ]
      expect(consoleOutput).toEqual(expectConsoleOutput)
    })

    it('successfully ignores a CVE', async () => {
      // Ensure CSV is not already ignored
      const currentDomainState = await (await query`RETURN DOCUMENT(domains, ${domain._key}).ignoredCves || []`).next()
      expect(currentDomainState).toEqual([])

      const cve = 'CVE-1234-55555'
      const response = await graphql({
        schema,
        source: `
        mutation {
          ignoreCve(input: { domainId: "${toGlobalId('domain', domain._key)}", ignoredCve: "${cve}" }) {
            result {
              ... on Domain {
                domain
                ignoredCves
              }
            }
          }
        }`,
        rootValue: null,
        contextValue: superAdminContext,
      })

      const expectedResponse = {
        data: {
          ignoreCve: {
            result: {
              domain: domain.domain,
              ignoredCves: [cve],
            },
          },
        },
      }
      expect(response).toEqual(expectedResponse)

      const domainCursor = await query`
        FOR domain IN domains
          FILTER domain._key == ${domain._key}
          RETURN domain
      `
      const domainArr = await domainCursor.all()
      const domainObj = domainArr[0]
      expect(domainObj.ignoredCves).toEqual([cve])

      const expectConsoleOutput = [
        `User: "${superAdminUser._key}" successfully ignored CVE "${cve}" on domain: "${domain._key}".`,
      ]
      expect(consoleOutput).toEqual(expectConsoleOutput)
    })
  })
})
