const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { toGlobalId } = require('graphql-relay')
const { graphql, GraphQLSchema } = require('graphql')

const { createQuerySchema } = require('../queries')
const { createMutationSchema } = require('../mutations')
const { makeMigrations } = require('../../migrations')
const { cleanseInput } = require('../validators')
const { checkDomainPermission, userRequired } = require('../auth')
const {
  spfLoaderConnectionsByDomainId,
  spfLoaderByKey,
  domainLoaderByDomain,
  domainLoaderByKey,
  userLoaderByKey,
  spfGuidanceTagLoader,
  spfGuidanceTagConnectionsLoader,
} = require('../loaders')

describe('given the spfType object', () => {
  let query,
    drop,
    truncate,
    migrate,
    collections,
    user,
    domain,
    schema,
    org,
    spf

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
    spf = await collections.spf.save({
      timestamp: '2020-10-02T12:43:39Z',
      lookups: 5,
      record: 'txtRecord',
      spfDefault: 'default',
      guidanceTags: ['spf1'],
    })
    await collections.domainsSPF.save({
      _from: domain._id,
      _to: spf._id,
    })
    await collections.spfGuidanceTags.save({
      _key: 'spf1',
      tagName: 'SPF-TAG',
      guidance: 'Some Interesting Guidance',
      refLinksGuide: [
        {
          description: 'refLinksGuide Description',
          ref_link: 'www.refLinksGuide.ca',
        },
      ],
      refLinksTechnical: [
        {
          description: 'refLinksTechnical Description',
          ref_link: 'www.refLinksTechnical.ca',
        },
      ],
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
                spf(first: 5) {
                  edges {
                    node {
                      id
                      domain {
                        id
                      }
                      timestamp
                      lookups
                      record
                      spfDefault
                      guidanceTags(first: 5) {
                        edges {
                          node {
                            id
                            tagId
                            tagName
                            guidance
                            refLinks {
                              description
                              refLink
                            }
                            refLinksTech {
                              description
                              refLink
                            }
                          }
                        }
                        totalCount
                        pageInfo {
                          hasNextPage
                          hasPreviousPage
                          startCursor
                          endCursor
                        }
                      }
                    }
                  }
                  totalCount
                  pageInfo {
                    hasNextPage
                    hasPreviousPage
                    startCursor
                    endCursor
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
            checkDomainPermission: checkDomainPermission({
              query,
              userId: user._key,
            }),
            userRequired: userRequired({
              userId: user._key,
              userLoaderByKey: userLoaderByKey(query),
            }),
          },
          validators: {
            cleanseInput,
          },
          loaders: {
            spfLoaderConnectionsByDomainId: spfLoaderConnectionsByDomainId(
              query,
              user._key,
              cleanseInput,
            ),
            spfLoaderByKey: spfLoaderByKey(query),
            spfGuidanceTagLoader: spfGuidanceTagLoader(query),
            spfGuidanceTagConnectionsLoader: spfGuidanceTagConnectionsLoader(
              query,
              user._key,
              cleanseInput,
            ),
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
              spf: {
                edges: [
                  {
                    node: {
                      id: toGlobalId('spf', spf._key),
                      domain: {
                        id: toGlobalId('domains', domain._key),
                      },
                      timestamp: new Date('2020-10-02T12:43:39.000Z'),
                      lookups: 5,
                      record: 'txtRecord',
                      spfDefault: 'default',
                      guidanceTags: {
                        edges: [
                          {
                            node: {
                              id: toGlobalId('guidanceTags', 'spf1'),
                              tagId: 'spf1',
                              tagName: 'SPF-TAG',
                              guidance: 'Some Interesting Guidance',
                              refLinks: [
                                {
                                  description: 'refLinksGuide Description',
                                  refLink: 'www.refLinksGuide.ca',
                                },
                              ],
                              refLinksTech: [
                                {
                                  description: 'refLinksTechnical Description',
                                  refLink: 'www.refLinksTechnical.ca',
                                },
                              ],
                            },
                          },
                        ],
                        totalCount: 1,
                        pageInfo: {
                          hasNextPage: false,
                          hasPreviousPage: false,
                          startCursor: toGlobalId('guidanceTags', 'spf1'),
                          endCursor: toGlobalId('guidanceTags', 'spf1'),
                        },
                      },
                    },
                  },
                ],
                totalCount: 1,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: toGlobalId('spf', spf._key),
                  endCursor: toGlobalId('spf', spf._key),
                },
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
