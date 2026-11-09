import { graphql, GraphQLList, GraphQLSchema, GraphQLString } from 'graphql'
import { dbNameFromFile } from 'arango-tools'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { createUserContextGenerator, ensureDatabase as ensure } from '../../../testUtilities'
import dbschema from '../../../../database.json'
import { createI18n } from '../../../create-i18n'
import { collectionNames } from '../../../collection-names'
import { PhpStatusEnum } from '../../../enums'
import { CveID } from '../../../scalars'
import { phpResultType } from '../php-result'

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
  query {
    findDomainByDomain(domain: "php.domain.gc.ca") {
      phpResult {
        status
        version
        advisories
        cves
        evidence
      }
    }
  }
`

describe('given the phpResult object', () => {
  describe('testing its field definitions', () => {
    it('has the phpResult fields', () => {
      const fields = phpResultType.getFields()

      expect({
        status: fields.status.type,
        version: fields.version.type,
        advisories: fields.advisories.type,
        cves: fields.cves.type,
        evidence: fields.evidence.type,
      }).toEqual({
        status: PhpStatusEnum,
        version: GraphQLString,
        advisories: new GraphQLList(GraphQLString),
        cves: new GraphQLList(CveID),
        evidence: new GraphQLList(GraphQLString),
      })
    })
  })

  describe('read through the domain phpResult field', () => {
    let db, query, drop, truncate, collections, transaction, createUserContext, userWithAccess, userWithoutAccess

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
      userWithAccess = await collections.users.save({
        userName: 'with.access@istio.actually.exists',
        emailValidated: true,
      })
      userWithoutAccess = await collections.users.save({
        userName: 'without.access@istio.actually.exists',
        emailValidated: true,
      })
      const org = await collections.organizations.save({
        orgDetails: {
          en: { slug: 'test-org', acronym: 'TO' },
          fr: { slug: 'org-test', acronym: 'OT' },
        },
      })
      const domain = await collections.domains.save({
        domain: 'php.domain.gc.ca',
        slug: 'php-domain-gc-ca',
        phpResult: {
          status: 'vulnerable',
          version: 'PHP/8.1.2-1ubuntu2.19',
          advisories: ['AL26-026'],
          cves: ['CVE-2026-109618', 'CVE-2026-109619'],
          evidence: ['X-Powered-By: PHP/8.1.2-1ubuntu2.19', 'PHPSESSID cookie'],
        },
      })
      await collections.affiliations.save({ _from: org._id, _to: userWithAccess._id, permission: 'user' })
      await collections.claims.save({ _from: org._id, _to: domain._id })
    })

    afterEach(async () => {
      consoleOutput.length = 0
      await truncate()
    })

    afterAll(async () => {
      await drop()
    })

    it('returns the scan-derived result to a user with permission for the domain', async () => {
      const contextValue = await createUserContext({ userKey: userWithAccess._key, loginRequiredBool: false })

      const response = await graphql({ schema, source, contextValue })

      expect(response).toEqual({
        data: {
          findDomainByDomain: {
            phpResult: {
              status: 'VULNERABLE',
              version: 'PHP/8.1.2-1ubuntu2.19',
              advisories: ['AL26-026'],
              cves: ['CVE-2026-109618', 'CVE-2026-109619'],
              evidence: ['X-Powered-By: PHP/8.1.2-1ubuntu2.19', 'PHPSESSID cookie'],
            },
          },
        },
      })
    })

    it('returns null without an error to a user without permission for the domain', async () => {
      const contextValue = await createUserContext({ userKey: userWithoutAccess._key, loginRequiredBool: false })

      const response = await graphql({ schema, source, contextValue })

      expect(response).toEqual({
        data: {
          findDomainByDomain: {
            phpResult: null,
          },
        },
      })
    })
  })
})
