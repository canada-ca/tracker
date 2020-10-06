require('dotenv-safe').config({
  allowEmptyValues: true,
})

const { DB_PASS: rootPass, DB_URL: url } = process.env
const bcrypt = require('bcrypt')

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { toGlobalId } = require('graphql-relay')
const { graphql, GraphQLSchema } = require('graphql')

const { createQuerySchema } = require('../queries')
const { createMutationSchema } = require('../mutations')
const { makeMigrations } = require('../../migrations')
const { cleanseInput } = require('../validators')
const { checkDomainPermission, tokenize, userRequired } = require('../auth')
const {
  dmarcLoaderConnectionsByDomainId,
  dmarcLoaderByKey,
  domainLoaderByDomain,
  domainLoaderByKey,
  userLoaderByKey,
  userLoaderByUserName,
} = require('../loaders')

describe('given the dmarcType object', () => {
  let query,
    drop,
    truncate,
    migrate,
    collections,
    user,
    domain,
    schema,
    org,
    dmarc

  const consoleInfoOutput = []
  const mockedInfo = (output) => consoleInfoOutput.push(output)

  const consoleWarnOutput = []
  const mockedWarn = (output) => consoleWarnOutput.push(output)

  const consoleErrorOutput = []
  const mockedError = (output) => consoleErrorOutput.push(output)

  beforeAll(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
  })

  beforeEach(async () => {
    await truncate()
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
    await graphql(
      schema,
      `
        mutation {
          signUp(
            input: {
              displayName: "Test Account"
              userName: "test.account@istio.actually.exists"
              password: "testpassword123"
              confirmPassword: "testpassword123"
              preferredLang: FRENCH
            }
          ) {
            authResult {
              user {
                id
              }
            }
          }
        }
      `,
      null,
      {
        query,
        auth: {
          bcrypt,
          tokenize,
        },
        validators: {
          cleanseInput,
        },
        loaders: {
          userLoaderByUserName: userLoaderByUserName(query),
        },
      },
    )
    consoleWarnOutput.length = 0
    consoleErrorOutput.length = 0
    consoleInfoOutput.length = 0

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
      permission: 'admin',
    })
    domain = await collections.domains.save({
      domain: 'test.domain.gc.ca',
      slug: 'test-domain-gc-ca',
    })
    await collections.claims.save({
      _from: org._id,
      _to: domain._id,
    })
    dmarc = await collections.dmarc.save({
      timestamp: '2020-10-02T12:43:39Z',
      dmarcPhase: 1,
      record: 'txtRecord',
      pPolicy: 'pPolicy',
      spPolicy: 'spPolicy',
      pct: 100,
      dmarcGuidanceTags: ['dmarc1', 'dmarc2'],
    })
    await collections.domainsDMARC.save({
      _from: domain._id,
      _to: dmarc._id,
    })
  })

  afterAll(async () => {
    await drop()
  })

  describe('all fields can be queried', () => {
    it('resolves all fields', async () => {
      const response = await graphql(
        schema,
        `
          query {
            findDomainByDomain(domain: "test.domain.gc.ca") {
              id
              domain
              email {
                dmarc {
                  edges {
                    node {
                      id
                      domain {
                        domain
                      }
                      timestamp
                      dmarcPhase
                      record
                      pPolicy
                      spPolicy
                      pct
                      dmarcGuidanceTags
                    }
                  }
                }
              }
            }
          }
        `,
        null,
        {
          userId: user._key,
          query: query,
          auth: {
            checkDomainPermission,
            userRequired,
          },
          validators: {
            cleanseInput,
          },
          loaders: {
            dmarcLoaderConnectionsByDomainId: dmarcLoaderConnectionsByDomainId(query, user._key, cleanseInput),
            dmarcLoaderByKey: dmarcLoaderByKey(query),
            domainLoaderByDomain: domainLoaderByDomain(query),
            domainLoaderByKey: domainLoaderByKey(query),
            userLoaderByKey: userLoaderByKey(query),
          },
        },
      )

      const expectedResponse = {
        data: {
          findDomainByDomain: {
            id: toGlobalId('domains', domain._key),
            domain: 'test.domain.gc.ca',
            email: {
              dmarc: {
                edges: [
                  {
                    node: {
                      id: toGlobalId('dmarc', dmarc._key),
                      domain: {
                        domain: 'test.domain.gc.ca',
                      },
                      timestamp: new Date('2020-10-02T12:43:39Z'),
                      dmarcPhase: 1,
                      record: 'txtRecord',
                      pPolicy: 'pPolicy',
                      spPolicy: 'spPolicy',
                      pct: 100,
                      dmarcGuidanceTags: ['dmarc1', 'dmarc2'],
                    },
                  },
                ],
              },
            },
          },
        },
      }
      expect(response).toEqual(expectedResponse)
      expect(consoleInfoOutput).toEqual([
        `User ${user._key} successfully retrieved domain ${domain._key}.`,
      ])
    })
  })
})
