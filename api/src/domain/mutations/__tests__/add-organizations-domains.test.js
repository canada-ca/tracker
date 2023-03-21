import { ensure, dbNameFromFile } from 'arango-tools'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { cleanseInput, slugify } from '../../../validators'
import {
  checkPermission,
  userRequired,
  checkSuperAdmin,
  saltedHash,
  verifiedRequired,
  tfaRequired,
} from '../../../auth'
import { loadDomainByDomain } from '../../loaders'
import {
  loadOrgByKey,
  loadOrgConnectionsByDomainId,
} from '../../../organization/loaders'
import { loadUserByKey } from '../../../user/loaders'
import dbschema from '../../../../database.json'
import { collectionNames } from '../../../collection-names'

const { DB_PASS: rootPass, DB_URL: url, HASHING_SECRET } = process.env

describe('given the addOrganizationsDomains mutation', () => {
  let query, drop, truncate, schema, collections, transaction, user, org

  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)
  beforeAll(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
    // Create GQL Schema
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
  })
  afterEach(() => {
    consoleOutput.length = 0
  })
  describe('given a successful bulk domain creation', () => {
    beforeAll(async () => {
      ;({ query, drop, truncate, collections, transaction } = await ensure({
        variables: {
          dbname: dbNameFromFile(__filename),
          username: 'root',
          rootPassword: rootPass,
          password: rootPass,
          url,
        },

        schema: dbschema,
      }))
    })
    beforeEach(async () => {
      user = await collections.users.save({
        userName: 'test.account@istio.actually.exists',
        emailValidated: true,
        tfaSendMethod: 'email',
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
    })
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
    })

    describe('user has super admin permission level', () => {
      beforeEach(async () => {
        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'super_admin',
        })
      })
      it('creates domains', async () => {
        const response = await graphql(
          schema,
          `
            mutation {
              addOrganizationsDomains(
                input: {
                  orgId: "${toGlobalId('organizations', org._key)}"
                  domains: ["test.domain.gov", "test.domain2.gov"]
                  hideNewDomains: false
                  tagNewDomains: false
                  audit: false
                }
              ) {
                result {
                  ... on DomainResult {
                    status
                  }
                  ... on DomainError {
                    code
                    description
                  }
                }
              }
            }
        `,
          null,
          {
            request: {
              language: 'en',
            },
            query,
            collections: collectionNames,
            transaction,
            userKey: user._key,
            publish: jest.fn(),
            auth: {
              checkPermission: checkPermission({ userKey: user._key, query }),
              saltedHash: saltedHash(HASHING_SECRET),
              userRequired: userRequired({
                userKey: user._key,
                loadUserByKey: loadUserByKey({ query }),
              }),
              checkSuperAdmin: checkSuperAdmin({ userKey: user._key, query }),
              verifiedRequired: verifiedRequired({}),
              tfaRequired: tfaRequired({}),
            },
            loaders: {
              loadDomainByDomain: loadDomainByDomain({ query }),
              loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
              loadOrgConnectionsByDomainId: loadOrgConnectionsByDomainId({
                query,
                language: 'en',
                userKey: user._key,
                cleanseInput,
                auth: { loginRequiredBool: true },
              }),
              loadUserByKey: loadUserByKey({ query }),
            },
            validators: { cleanseInput, slugify },
          },
        )
        const expectedResponse = {
          data: {
            addOrganizationsDomains: {
              result: {
                status: `Successfully added 2 domains to treasury-board-secretariat.`,
              },
            },
          },
        }

        // expect(response).toEqual(expectedResponse)

        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully created domains in org: treasury-board-secretariat.`,
        ])
      })
    })
  })

  //   describe('given an unsuccessful bulk domain creation', () => {})
})
