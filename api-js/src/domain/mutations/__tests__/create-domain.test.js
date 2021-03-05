import { ensure, dbNameFromFile } from 'arango-tools'
import bcrypt from 'bcryptjs'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import { databaseOptions } from '../../../../database-options'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { cleanseInput, slugify } from '../../../validators'
import { checkPermission, tokenize, userRequired } from '../../../auth'
import { domainLoaderByDomain } from '../../loaders'
import {
  orgLoaderByKey,
  orgLoaderConnectionArgsByDomainId,
} from '../../../organization/loaders'
import { userLoaderByKey, userLoaderByUserName } from '../../../user/loaders'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('create a domain', () => {
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
    ;({ query, drop, truncate, collections, transaction } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
  })

  beforeEach(async () => {
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
            result {
              ... on AuthResult {
                user {
                  id
                }
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

    const userCursor = await query`
      FOR user IN users
        RETURN user
    `
    user = await userCursor.next()
    consoleOutput.length = 0
  })

  afterEach(async () => {
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

  describe('given a successful domain creation', () => {
    describe('user has super admin permission level', () => {
      describe('user belongs to the same org', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'super_admin',
          })
        })
        it('returns the domain', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                createDomain(
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
                    domain: "test.gc.ca"
                    selectors: ["selector1._domainkey", "selector2._domainkey"]
                  }
                ) {
                  domain {
                    id
                    domain
                    lastRan
                    selectors
                    status {
                      dkim
                      dmarc
                      https
                      spf
                      ssl
                    }
                    organizations (first: 5) {
                      edges{ 
                        node {
                          id
                          name
                        }
                      }
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
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                domainLoaderByDomain: domainLoaderByDomain(query),
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                orgLoaderConnectionArgsByDomainId: orgLoaderConnectionArgsByDomainId(
                  query,
                  'en',
                  user._key,
                  cleanseInput,
                ),
                userLoaderByKey: userLoaderByKey(query),
              },
              validators: { cleanseInput, slugify },
            },
          )

          const domainCursor = await query`
            FOR domain IN domains
              RETURN domain
          `
          const domain = await domainCursor.next()

          const expectedResponse = {
            data: {
              createDomain: {
                domain: {
                  id: toGlobalId('domains', domain._key),
                  domain: 'test.gc.ca',
                  lastRan: null,
                  selectors: ['selector1._domainkey', 'selector2._domainkey'],
                  status: {
                    dkim: null,
                    dmarc: null,
                    https: null,
                    spf: null,
                    ssl: null,
                  },
                  organizations: {
                    edges: [
                      {
                        node: {
                          id: toGlobalId('organizations', org._key),
                          name: 'Treasury Board of Canada Secretariat',
                        },
                      },
                    ],
                  },
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)

          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully created ${domain.domain} in org: treasury-board-secretariat.`,
          ])
        })
      })
      describe('user belongs to a different org', () => {
        let secondOrg
        beforeEach(async () => {
          secondOrg = await collections.organizations.save({
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
            _from: secondOrg._id,
            _to: user._id,
            permission: 'super_admin',
          })
        })
        it('returns the domain', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                createDomain(
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
                    domain: "test.gc.ca"
                    selectors: ["selector1._domainkey", "selector2._domainkey"]
                  }
                ) {
                  domain {
                    id
                    domain
                    lastRan
                    selectors
                    status {
                      dkim
                      dmarc
                      https
                      spf
                      ssl
                    }
                    organizations (first: 5) {
                      edges{ 
                        node {
                          id
                          name
                        }
                      }
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
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                domainLoaderByDomain: domainLoaderByDomain(query),
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                orgLoaderConnectionArgsByDomainId: orgLoaderConnectionArgsByDomainId(
                  query,
                  'en',
                  user._key,
                  cleanseInput,
                ),
                userLoaderByKey: userLoaderByKey(query),
              },
              validators: { cleanseInput, slugify },
            },
          )

          const domainCursor = await query`
            FOR domain IN domains
              RETURN domain
          `
          const domain = await domainCursor.next()

          const expectedResponse = {
            data: {
              createDomain: {
                domain: {
                  id: toGlobalId('domains', domain._key),
                  domain: 'test.gc.ca',
                  lastRan: null,
                  selectors: ['selector1._domainkey', 'selector2._domainkey'],
                  status: {
                    dkim: null,
                    dmarc: null,
                    https: null,
                    spf: null,
                    ssl: null,
                  },
                  organizations: {
                    edges: [
                      {
                        node: {
                          id: toGlobalId('organizations', org._key),
                          name: 'Treasury Board of Canada Secretariat',
                        },
                      },
                    ],
                  },
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)

          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully created ${domain.domain} in org: treasury-board-secretariat.`,
          ])
        })
      })
    })
    describe('user has admin permission level', () => {
      beforeEach(async () => {
        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'admin',
        })
      })
      it('returns the domain', async () => {
        const response = await graphql(
          schema,
          `
            mutation {
              createDomain(
                input: {
                  orgId: "${toGlobalId('organizations', org._key)}"
                  domain: "test.gc.ca"
                  selectors: ["selector1._domainkey", "selector2._domainkey"]
                }
              ) {
                domain {
                  id
                  domain
                  lastRan
                  selectors
                  status {
                    dkim
                    dmarc
                    https
                    spf
                    ssl
                  }
                  organizations (first: 5) {
                    edges{ 
                      node {
                        id
                        name
                      }
                    }
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
            collections,
            transaction,
            userKey: user._key,
            auth: {
              checkPermission: checkPermission({ userKey: user._key, query }),
              userRequired: userRequired({
                userKey: user._key,
                userLoaderByKey: userLoaderByKey(query),
              }),
            },
            loaders: {
              domainLoaderByDomain: domainLoaderByDomain(query),
              orgLoaderByKey: orgLoaderByKey(query, 'en'),
              orgLoaderConnectionArgsByDomainId: orgLoaderConnectionArgsByDomainId(
                query,
                'en',
                user._key,
                cleanseInput,
              ),
              userLoaderByKey: userLoaderByKey(query),
            },
            validators: { cleanseInput, slugify },
          },
        )

        const domainCursor = await query`
          FOR domain IN domains
            RETURN domain
        `
        const domain = await domainCursor.next()

        const expectedResponse = {
          data: {
            createDomain: {
              domain: {
                id: toGlobalId('domains', domain._key),
                domain: 'test.gc.ca',
                lastRan: null,
                selectors: ['selector1._domainkey', 'selector2._domainkey'],
                status: {
                  dkim: null,
                  dmarc: null,
                  https: null,
                  spf: null,
                  ssl: null,
                },
                organizations: {
                  edges: [
                    {
                      node: {
                        id: toGlobalId('organizations', org._key),
                        name: 'Treasury Board of Canada Secretariat',
                      },
                    },
                  ],
                },
              },
            },
          },
        }

        expect(response).toEqual(expectedResponse)

        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully created ${domain.domain} in org: treasury-board-secretariat.`,
        ])
      })
    })
    describe('user has user permission level', () => {
      beforeEach(async () => {
        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'user',
        })
      })
      it('returns the domain', async () => {
        const response = await graphql(
          schema,
          `
            mutation {
              createDomain(
                input: {
                  orgId: "${toGlobalId('organizations', org._key)}"
                  domain: "test.gc.ca"
                  selectors: ["selector1._domainkey", "selector2._domainkey"]
                }
              ) {
                domain {
                  id
                  domain
                  lastRan
                  selectors
                  status {
                    dkim
                    dmarc
                    https
                    spf
                    ssl
                  }
                  organizations (first: 5) {
                    edges{ 
                      node {
                        id
                        name
                      }
                    }
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
            collections,
            transaction,
            userKey: user._key,
            auth: {
              checkPermission: checkPermission({ userKey: user._key, query }),
              userRequired: userRequired({
                userKey: user._key,
                userLoaderByKey: userLoaderByKey(query),
              }),
            },
            loaders: {
              domainLoaderByDomain: domainLoaderByDomain(query),
              orgLoaderByKey: orgLoaderByKey(query, 'en'),
              orgLoaderConnectionArgsByDomainId: orgLoaderConnectionArgsByDomainId(
                query,
                'en',
                user._key,
                cleanseInput,
              ),
              userLoaderByKey: userLoaderByKey(query),
            },
            validators: { cleanseInput, slugify },
          },
        )

        const domainCursor = await query`
          FOR domain IN domains
            RETURN domain
        `
        const domain = await domainCursor.next()

        const expectedResponse = {
          data: {
            createDomain: {
              domain: {
                id: toGlobalId('domains', domain._key),
                domain: 'test.gc.ca',
                lastRan: null,
                selectors: ['selector1._domainkey', 'selector2._domainkey'],
                status: {
                  dkim: null,
                  dmarc: null,
                  https: null,
                  spf: null,
                  ssl: null,
                },
                organizations: {
                  edges: [
                    {
                      node: {
                        id: toGlobalId('organizations', org._key),
                        name: 'Treasury Board of Canada Secretariat',
                      },
                    },
                  ],
                },
              },
            },
          },
        }

        expect(response).toEqual(expectedResponse)

        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully created ${domain.domain} in org: treasury-board-secretariat.`,
        ])
      })
    })
    describe('domain can be created in a different organization', () => {
      let secondOrg
      beforeEach(async () => {
        secondOrg = await collections.organizations.save({
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
          _from: secondOrg._id,
          _to: user._id,
          permission: 'super_admin',
        })
      })
      describe('selectors are not added', () => {
        beforeEach(async () => {
          const domain = await collections.domains.save({
            domain: 'test.gc.ca',
            selectors: ['selector1._domainkey', 'selector2._domainkey'],
          })
          await collections.claims.save({
            _from: org._id,
            _to: domain._id,
          })
        })
        it('returns the domain', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              createDomain(
                input: {
                  orgId: "${toGlobalId('organizations', secondOrg._key)}"
                  domain: "test.gc.ca"
                }
              ) {
                domain {
                  id
                  domain
                  lastRan
                  selectors
                  status {
                    dkim
                    dmarc
                    https
                    spf
                    ssl
                  }
                  organizations (first: 5) {
                    edges{ 
                      node {
                        id
                        name
                      }
                    }
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
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                domainLoaderByDomain: domainLoaderByDomain(query),
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                orgLoaderConnectionArgsByDomainId: orgLoaderConnectionArgsByDomainId(
                  query,
                  'en',
                  user._key,
                  cleanseInput,
                ),
                userLoaderByKey: userLoaderByKey(query),
              },
              validators: { cleanseInput, slugify },
            },
          )

          const domainCursor = await query`
          FOR domain IN domains
            RETURN domain
        `
          const domain = await domainCursor.next()

          const expectedResponse = {
            data: {
              createDomain: {
                domain: {
                  id: toGlobalId('domains', domain._key),
                  domain: 'test.gc.ca',
                  lastRan: null,
                  selectors: ['selector1._domainkey', 'selector2._domainkey'],
                  status: {
                    dkim: null,
                    dmarc: null,
                    https: null,
                    spf: null,
                    ssl: null,
                  },
                  organizations: {
                    edges: [
                      {
                        node: {
                          id: toGlobalId('organizations', org._key),
                          name: 'Treasury Board of Canada Secretariat',
                        },
                      },
                      {
                        node: {
                          id: toGlobalId('organizations', secondOrg._key),
                          name: 'Communications Security Establishment',
                        },
                      },
                    ],
                  },
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)

          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully created ${domain.domain} in org: communications-security-establishment.`,
          ])
        })
      })
      describe('selectors are the same', () => {
        beforeEach(async () => {
          const domain = await collections.domains.save({
            domain: 'test.gc.ca',
            selectors: ['selector1._domainkey', 'selector2._domainkey'],
          })
          await collections.claims.save({
            _from: org._id,
            _to: domain._id,
          })
        })
        it('returns the domain', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              createDomain(
                input: {
                  orgId: "${toGlobalId('organizations', secondOrg._key)}"
                  domain: "test.gc.ca"
                  selectors: ["selector1._domainkey", "selector2._domainkey"]
                }
              ) {
                domain {
                  id
                  domain
                  lastRan
                  selectors
                  status {
                    dkim
                    dmarc
                    https
                    spf
                    ssl
                  }
                  organizations (first: 5) {
                    edges{ 
                      node {
                        id
                        name
                      }
                    }
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
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                domainLoaderByDomain: domainLoaderByDomain(query),
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                orgLoaderConnectionArgsByDomainId: orgLoaderConnectionArgsByDomainId(
                  query,
                  'en',
                  user._key,
                  cleanseInput,
                ),
                userLoaderByKey: userLoaderByKey(query),
              },
              validators: { cleanseInput, slugify },
            },
          )

          const domainCursor = await query`
          FOR domain IN domains
            RETURN domain
        `
          const domain = await domainCursor.next()

          const expectedResponse = {
            data: {
              createDomain: {
                domain: {
                  id: toGlobalId('domains', domain._key),
                  domain: 'test.gc.ca',
                  lastRan: null,
                  selectors: ['selector1._domainkey', 'selector2._domainkey'],
                  status: {
                    dkim: null,
                    dmarc: null,
                    https: null,
                    spf: null,
                    ssl: null,
                  },
                  organizations: {
                    edges: [
                      {
                        node: {
                          id: toGlobalId('organizations', org._key),
                          name: 'Treasury Board of Canada Secretariat',
                        },
                      },
                      {
                        node: {
                          id: toGlobalId('organizations', secondOrg._key),
                          name: 'Communications Security Establishment',
                        },
                      },
                    ],
                  },
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)

          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully created ${domain.domain} in org: communications-security-establishment.`,
          ])
        })
      })
      describe('new selectors are added', () => {
        beforeEach(async () => {
          const domain = await collections.domains.save({
            domain: 'test.gc.ca',
            selectors: ['selector1._domainkey', 'selector2._domainkey'],
          })
          await collections.claims.save({
            _from: org._id,
            _to: domain._id,
          })
        })
        it('returns the domain', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              createDomain(
                input: {
                  orgId: "${toGlobalId('organizations', secondOrg._key)}"
                  domain: "test.gc.ca"
                  selectors: ["selector3._domainkey", "selector4._domainkey"]
                }
              ) {
                domain {
                  id
                  domain
                  lastRan
                  selectors
                  status {
                    dkim
                    dmarc
                    https
                    spf
                    ssl
                  }
                  organizations (first: 5) {
                    edges{ 
                      node {
                        id
                        name
                      }
                    }
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
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                domainLoaderByDomain: domainLoaderByDomain(query),
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                orgLoaderConnectionArgsByDomainId: orgLoaderConnectionArgsByDomainId(
                  query,
                  'en',
                  user._key,
                  cleanseInput,
                ),
                userLoaderByKey: userLoaderByKey(query),
              },
              validators: { cleanseInput, slugify },
            },
          )

          const domainCursor = await query`
          FOR domain IN domains
            RETURN domain
        `
          const domain = await domainCursor.next()

          const expectedResponse = {
            data: {
              createDomain: {
                domain: {
                  id: toGlobalId('domains', domain._key),
                  domain: 'test.gc.ca',
                  lastRan: null,
                  selectors: [
                    'selector1._domainkey',
                    'selector2._domainkey',
                    'selector3._domainkey',
                    'selector4._domainkey',
                  ],
                  status: {
                    dkim: null,
                    dmarc: null,
                    https: null,
                    spf: null,
                    ssl: null,
                  },
                  organizations: {
                    edges: [
                      {
                        node: {
                          id: toGlobalId('organizations', org._key),
                          name: 'Treasury Board of Canada Secretariat',
                        },
                      },
                      {
                        node: {
                          id: toGlobalId('organizations', secondOrg._key),
                          name: 'Communications Security Establishment',
                        },
                      },
                    ],
                  },
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)

          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully created ${domain.domain} in org: communications-security-establishment.`,
          ])
        })
      })
    })
  })
  describe('given an unsuccessful domain creation', () => {
    let i18n
    describe('request language is english', () => {
      beforeAll(() => {
        i18n = setupI18n({
          locale: 'en',
          localeData: {
            en: { plurals: {} },
            fr: { plurals: {} },
          },
          locales: ['en', 'fr'],
          messages: {
            en: englishMessages.messages,
            fr: frenchMessages.messages,
          },
        })
      })
      describe('org does not exist', () => {
        it('returns an error', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                createDomain(
                  input: {
                    orgId: "b3JnYW5pemF0aW9uOjE="
                    domain: "test.gc.ca"
                    selectors: ["selector1._domainkey", "selector2._domainkey"]
                  }
                ) {
                  domain {
                    id
                    domain
                    lastRan
                    selectors
                    organizations(first: 5) {
                      edges {
                        node {
                          id
                          name
                        }
                      }
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              request: {
                language: 'en',
              },
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                domainLoaderByDomain: domainLoaderByDomain(query),
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                orgLoaderConnectionArgsByDomainId: orgLoaderConnectionArgsByDomainId(
                  query,
                  'en',
                  user._key,
                  cleanseInput,
                ),
                userLoaderByKey: userLoaderByKey(query),
              },
              validators: { cleanseInput, slugify },
            },
          )

          const error = [
            new GraphQLError('Unable to create domain. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to create a domain to an organization: 1 that does not exist.`,
          ])
        })
      })
      describe('user does not belong to organization', () => {
        it('returns an error', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                createDomain(
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
                    domain: "test.gc.ca"
                    selectors: ["selector1._domainkey", "selector2._domainkey"]
                  }
                ) {
                  domain {
                    id
                    domain
                    lastRan
                    selectors
                    organizations (first: 5) {
                      edges{ 
                        node {
                          id
                          name
                        }
                      }
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              request: {
                language: 'en',
              },
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                domainLoaderByDomain: domainLoaderByDomain(query),
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                orgLoaderConnectionArgsByDomainId: orgLoaderConnectionArgsByDomainId(
                  query,
                  'en',
                  user._key,
                  cleanseInput,
                ),
                userLoaderByKey: userLoaderByKey(query),
              },
              validators: { cleanseInput, slugify },
            },
          )

          const error = [
            new GraphQLError('Unable to create domain. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to create a domain in: treasury-board-secretariat, however they do not have permission to do so.`,
          ])
        })
      })
      describe('the domain already exists in the given organization', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'user',
          })
          const domain = await collections.domains.save({
            domain: 'test.gc.ca',
          })
          await collections.claims.save({
            _from: org._id,
            _to: domain._id,
          })
        })
        it('returns an error', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                createDomain(
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
                    domain: "test.gc.ca"
                    selectors: ["selector1._domainkey", "selector2._domainkey"]
                  }
                ) {
                  domain {
                    id
                    domain
                    lastRan
                    selectors
                    organizations (first: 5) {
                      edges{ 
                        node {
                          id
                          name
                        }
                      }
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              request: {
                language: 'en',
              },
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                domainLoaderByDomain: domainLoaderByDomain(query),
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                orgLoaderConnectionArgsByDomainId: orgLoaderConnectionArgsByDomainId(
                  query,
                  'en',
                  user._key,
                  cleanseInput,
                ),
                userLoaderByKey: userLoaderByKey(query),
              },
              validators: { cleanseInput, slugify },
            },
          )

          const error = [
            new GraphQLError('Unable to create domain. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to create a domain for: treasury-board-secretariat, however that org already has that domain claimed.`,
          ])
        })
      })
      describe('database error occurs', () => {
        describe('when checking to see if org already contains domain', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: org._id,
              _to: user._id,
              permission: 'user',
            })
          })
          it('returns an error message', async () => {
            const domainLoader = domainLoaderByDomain(query)
            const orgIdLoader = orgLoaderByKey(query, 'en')
            const userKeyLoader = userLoaderByKey(query)
            const orgConnectionLoader = orgLoaderConnectionArgsByDomainId(
              query,
              'en',
              user._key,
              cleanseInput,
            )

            const mockedQuery = jest
              .fn()
              .mockReturnValueOnce({
                next() {
                  return 'user'
                },
              })
              .mockReturnValueOnce({
                next() {
                  return 'user'
                },
              })
              .mockRejectedValue(new Error('Database error occurred.'))

            const response = await graphql(
              schema,
              `
                mutation {
                  createDomain(
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
                      domain: "test.gc.ca"
                      selectors: ["selector1._domainkey", "selector2._domainkey"]
                    }
                  ) {
                    domain {
                      id
                      domain
                      lastRan
                      selectors
                      organizations (first: 5) {
                        edges{ 
                          node {
                            id
                            name
                          }
                        }
                      }
                    }
                  }
                }
              `,
              null,
              {
                i18n,
                request: {
                  language: 'en',
                },
                query: mockedQuery,
                collections,
                transaction,
                userKey: user._key,
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query: mockedQuery,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    userLoaderByKey: userKeyLoader,
                  }),
                },
                loaders: {
                  domainLoaderByDomain: domainLoader,
                  orgLoaderByKey: orgIdLoader,
                  orgLoaderConnectionArgsByDomainId: orgConnectionLoader,
                  userLoaderByKey: userKeyLoader,
                },
                validators: { cleanseInput, slugify },
              },
            )

            const error = [
              new GraphQLError('Unable to create domain. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred while running check to see if domain already exists in an org: Error: Database error occurred.`,
            ])
          })
        })
        describe('when committing transaction to database', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: org._id,
              _to: user._id,
              permission: 'user',
            })
          })
          it('returns an error message', async () => {
            const domainLoader = domainLoaderByDomain(query)
            const orgIdLoader = orgLoaderByKey(query, 'en')
            const userKeyLoader = userLoaderByKey(query)
            const orgConnectionLoader = orgLoaderConnectionArgsByDomainId(
              query,
              'en',
              user._key,
              cleanseInput,
            )

            const mockedTransaction = jest.fn().mockReturnValueOnce({
              step() {
                return 'user'
              },
              commit() {
                throw new Error('Database error occurred.')
              },
            })

            const response = await graphql(
              schema,
              `
                mutation {
                  createDomain(
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
                      domain: "test.gc.ca"
                      selectors: ["selector1._domainkey", "selector2._domainkey"]
                    }
                  ) {
                    domain {
                      id
                      domain
                      lastRan
                      selectors
                      organizations (first: 5) {
                        edges{ 
                          node {
                            id
                            name
                          }
                        }
                      }
                    }
                  }
                }
              `,
              null,
              {
                i18n,
                request: {
                  language: 'en',
                },
                query,
                collections,
                transaction: mockedTransaction,
                userKey: user._key,
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    userLoaderByKey: userLoaderByKey(query),
                  }),
                },
                loaders: {
                  domainLoaderByDomain: domainLoader,
                  orgLoaderByKey: orgIdLoader,
                  orgLoaderConnectionArgsByDomainId: orgConnectionLoader,
                  userLoaderByKey: userKeyLoader,
                },
                validators: { cleanseInput, slugify },
              },
            )

            const error = [
              new GraphQLError('Unable to create domain. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred while committing create domain transaction: Error: Database error occurred.`,
            ])
          })
        })
      })
    })
    describe('request language is french', () => {
      beforeAll(() => {
        i18n = setupI18n({
          locale: 'fr',
          localeData: {
            en: { plurals: {} },
            fr: { plurals: {} },
          },
          locales: ['en', 'fr'],
          messages: {
            en: englishMessages.messages,
            fr: frenchMessages.messages,
          },
        })
      })
      describe('org does not exist', () => {
        it('returns an error', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                createDomain(
                  input: {
                    orgId: "b3JnYW5pemF0aW9uOjE="
                    domain: "test.gc.ca"
                    selectors: ["selector1._domainkey", "selector2._domainkey"]
                  }
                ) {
                  domain {
                    id
                    domain
                    lastRan
                    selectors
                    organizations(first: 5) {
                      edges {
                        node {
                          id
                          name
                        }
                      }
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              request: {
                language: 'en',
              },
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                domainLoaderByDomain: domainLoaderByDomain(query),
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                orgLoaderConnectionArgsByDomainId: orgLoaderConnectionArgsByDomainId(
                  query,
                  'en',
                  user._key,
                  cleanseInput,
                ),
                userLoaderByKey: userLoaderByKey(query),
              },
              validators: { cleanseInput, slugify },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to create a domain to an organization: 1 that does not exist.`,
          ])
        })
      })
      describe('user does not belong to organization', () => {
        it('returns an error', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                createDomain(
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
                    domain: "test.gc.ca"
                    selectors: ["selector1._domainkey", "selector2._domainkey"]
                  }
                ) {
                  domain {
                    id
                    domain
                    lastRan
                    selectors
                    organizations (first: 5) {
                      edges{ 
                        node {
                          id
                          name
                        }
                      }
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              request: {
                language: 'en',
              },
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                domainLoaderByDomain: domainLoaderByDomain(query),
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                orgLoaderConnectionArgsByDomainId: orgLoaderConnectionArgsByDomainId(
                  query,
                  'en',
                  user._key,
                  cleanseInput,
                ),
                userLoaderByKey: userLoaderByKey(query),
              },
              validators: { cleanseInput, slugify },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to create a domain in: treasury-board-secretariat, however they do not have permission to do so.`,
          ])
        })
      })
      describe('the domain already exists in the given organization', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'user',
          })
          const domain = await collections.domains.save({
            domain: 'test.gc.ca',
          })
          await collections.claims.save({
            _from: org._id,
            _to: domain._id,
          })
        })
        it('returns an error', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                createDomain(
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
                    domain: "test.gc.ca"
                    selectors: ["selector1._domainkey", "selector2._domainkey"]
                  }
                ) {
                  domain {
                    id
                    domain
                    lastRan
                    selectors
                    organizations (first: 5) {
                      edges{ 
                        node {
                          id
                          name
                        }
                      }
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              request: {
                language: 'en',
              },
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                domainLoaderByDomain: domainLoaderByDomain(query),
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                orgLoaderConnectionArgsByDomainId: orgLoaderConnectionArgsByDomainId(
                  query,
                  'en',
                  user._key,
                  cleanseInput,
                ),
                userLoaderByKey: userLoaderByKey(query),
              },
              validators: { cleanseInput, slugify },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to create a domain for: treasury-board-secretariat, however that org already has that domain claimed.`,
          ])
        })
      })
      describe('database error occurs', () => {
        describe('when checking to see if org already contains domain', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: org._id,
              _to: user._id,
              permission: 'user',
            })
          })
          it('returns an error message', async () => {
            const domainLoader = domainLoaderByDomain(query)
            const orgIdLoader = orgLoaderByKey(query, 'en')
            const userKeyLoader = userLoaderByKey(query)
            const orgConnectionLoader = orgLoaderConnectionArgsByDomainId(
              query,
              'en',
              user._key,
              cleanseInput,
            )

            const mockedQuery = jest
              .fn()
              .mockReturnValueOnce({
                next() {
                  return 'user'
                },
              })
              .mockReturnValueOnce({
                next() {
                  return 'user'
                },
              })
              .mockRejectedValue(new Error('Database error occurred.'))

            const response = await graphql(
              schema,
              `
                mutation {
                  createDomain(
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
                      domain: "test.gc.ca"
                      selectors: ["selector1._domainkey", "selector2._domainkey"]
                    }
                  ) {
                    domain {
                      id
                      domain
                      lastRan
                      selectors
                      organizations (first: 5) {
                        edges{ 
                          node {
                            id
                            name
                          }
                        }
                      }
                    }
                  }
                }
              `,
              null,
              {
                i18n,
                request: {
                  language: 'en',
                },
                query: mockedQuery,
                collections,
                transaction,
                userKey: user._key,
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query: mockedQuery,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    userLoaderByKey: userKeyLoader,
                  }),
                },
                loaders: {
                  domainLoaderByDomain: domainLoader,
                  orgLoaderByKey: orgIdLoader,
                  orgLoaderConnectionArgsByDomainId: orgConnectionLoader,
                  userLoaderByKey: userKeyLoader,
                },
                validators: { cleanseInput, slugify },
              },
            )

            const error = [new GraphQLError('todo')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred while running check to see if domain already exists in an org: Error: Database error occurred.`,
            ])
          })
        })
        describe('when committing transaction to database', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: org._id,
              _to: user._id,
              permission: 'user',
            })
          })
          it('returns an error message', async () => {
            const domainLoader = domainLoaderByDomain(query)
            const orgIdLoader = orgLoaderByKey(query, 'en')
            const userKeyLoader = userLoaderByKey(query)
            const orgConnectionLoader = orgLoaderConnectionArgsByDomainId(
              query,
              'en',
              user._key,
              cleanseInput,
            )

            const mockedTransaction = jest.fn().mockReturnValueOnce({
              step() {
                return 'user'
              },
              commit() {
                throw new Error('Database error occurred.')
              },
            })

            const response = await graphql(
              schema,
              `
                mutation {
                  createDomain(
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
                      domain: "test.gc.ca"
                      selectors: ["selector1._domainkey", "selector2._domainkey"]
                    }
                  ) {
                    domain {
                      id
                      domain
                      lastRan
                      selectors
                      organizations (first: 5) {
                        edges{ 
                          node {
                            id
                            name
                          }
                        }
                      }
                    }
                  }
                }
              `,
              null,
              {
                i18n,
                request: {
                  language: 'en',
                },
                query,
                collections,
                transaction: mockedTransaction,
                userKey: user._key,
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    userLoaderByKey: userLoaderByKey(query),
                  }),
                },
                loaders: {
                  domainLoaderByDomain: domainLoader,
                  orgLoaderByKey: orgIdLoader,
                  orgLoaderConnectionArgsByDomainId: orgConnectionLoader,
                  userLoaderByKey: userKeyLoader,
                },
                validators: { cleanseInput, slugify },
              },
            )

            const error = [new GraphQLError('todo')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred while committing create domain transaction: Error: Database error occurred.`,
            ])
          })
        })
      })
    })
  })
})
