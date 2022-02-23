import { setupI18n } from '@lingui/core'
import { ensure, dbNameFromFile } from 'arango-tools'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { toGlobalId } from 'graphql-relay'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import {
  checkPermission,
  userRequired,
  verifiedRequired,
  tfaRequired,
} from '../../../auth'
import { loadOrgByKey } from '../../../organization/loaders'
import { loadUserByKey } from '../../../user/loaders'
import { loadAffiliationByKey } from '../../loaders'
import dbschema from '../../../../database.json';

const { DB_PASS: rootPass, DB_URL: url } = process.env

const orgOneData = {
  verified: true,
  summaries: {
    web: {
      pass: 50,
      fail: 1000,
      total: 1050,
    },
    mail: {
      pass: 50,
      fail: 1000,
      total: 1050,
    },
  },
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
}

const orgTwoData = {
  verified: true,
  summaries: {
    web: {
      pass: 50,
      fail: 1000,
      total: 1050,
    },
    mail: {
      pass: 50,
      fail: 1000,
      total: 1050,
    },
  },
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
}

const adminData = {
  userName: 'admin.account@istio.actually.exists',
  displayName: 'Test Admin',
  preferredLang: 'french',
  tfaValidated: false,
  emailValidated: true,
  tfaSendMethod: 'email',
}

const userData = {
  userName: 'test.account@istio.actually.exists',
  displayName: 'Test Account',
  preferredLang: 'french',
  tfaValidated: false,
  emailValidated: true,
  tfaSendMethod: 'email',
}

describe('given the removeUserFromOrg mutation', () => {
  let query,
    drop,
    truncate,
    schema,
    collections,
    transaction,
    i18n,
    user,
    orgOne,
    orgTwo,
    admin,
    affiliation

  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)
  beforeAll(() => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
    // Create GQL Schema
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
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
  afterEach(() => {
    consoleOutput.length = 0
  })

  describe('given a successful mutation', () => {
    beforeEach(async () => {
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
      orgOne = await collections.organizations.save(orgOneData)
      orgTwo = await collections.organizations.save(orgTwoData)
      admin = await collections.users.save(adminData)
      user = await collections.users.save(userData)
    })
    afterEach(async () => {
      await truncate()
      await drop()
    })
    describe('user is a super admin', () => {
      beforeEach(async () => {
        await collections.affiliations.save({
          _from: orgTwo._id,
          _to: admin._id,
          permission: 'super_admin',
        })
        affiliation = await collections.affiliations.save({
          _from: orgOne._id,
          _to: user._id,
          permission: 'admin',
        })
      })
      describe('super admin can remove an admin from any org', () => {
        it('removes the admin from the org', async () => {
          await graphql(
            schema,
            `
              mutation {
                removeUserFromOrg (
                  input: {
                    userId: "${toGlobalId('users', user._key)}"
                    orgId: "${toGlobalId('organizations', orgOne._key)}"
                  }
                ) {
                  result {
                    ... on RemoveUserFromOrgResult {
                      status
                      user {
                        id
                        userName
                      }
                    }
                    ... on AffiliationError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              query,
              collections,
              transaction,
              userKey: admin._key,
              auth: {
                checkPermission: checkPermission({
                  i18n,
                  userKey: admin._key,
                  query,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: admin._key,
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: admin._key,
                    i18n,
                  }),
                }),
                verifiedRequired: verifiedRequired({ i18n }),
                tfaRequired: tfaRequired({ i18n }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({
                  query,
                  language: 'en',
                  userKey: admin._key,
                  i18n,
                }),
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: admin._key,
                  i18n,
                }),
              },
              validators: { cleanseInput },
            },
          )

          const loader = loadAffiliationByKey({
            query,
            userKey: admin._key,
            i18n,
          })

          const data = await loader.load(affiliation._key)

          expect(data).toEqual(undefined)
          expect(consoleOutput).toEqual([
            `User: ${admin._key} successfully removed user: ${user._key} from org: ${orgOne._key}.`,
          ])
        })
        describe('users language is set to english', () => {
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
          it('returns a status message', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  removeUserFromOrg (
                    input: {
                      userId: "${toGlobalId('users', user._key)}"
                      orgId: "${toGlobalId('organizations', orgOne._key)}"
                    }
                  ) {
                    result {
                      ... on RemoveUserFromOrgResult {
                        status
                        user {
                          id
                          userName
                        }
                      }
                      ... on AffiliationError {
                        code
                        description
                      }
                    }
                  }
                }
              `,
              null,
              {
                i18n,
                query,
                collections,
                transaction,
                userKey: admin._key,
                auth: {
                  checkPermission: checkPermission({
                    i18n,
                    userKey: admin._key,
                    query,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: admin._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: admin._key,
                      i18n,
                    }),
                  }),
                  verifiedRequired: verifiedRequired({ i18n }),
                  tfaRequired: tfaRequired({ i18n }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    userKey: admin._key,
                    i18n,
                  }),
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: admin._key,
                    i18n,
                  }),
                },
                validators: { cleanseInput },
              },
            )

            const expectedResponse = {
              data: {
                removeUserFromOrg: {
                  result: {
                    status: 'Successfully removed user from organization.',
                    user: {
                      id: toGlobalId('user', user._key),
                      userName: 'test.account@istio.actually.exists',
                    },
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${admin._key} successfully removed user: ${user._key} from org: ${orgOne._key}.`,
            ])
          })
        })
        describe('users language is set to french', () => {
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
          it('returns a status message', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  removeUserFromOrg (
                    input: {
                      userId: "${toGlobalId('users', user._key)}"
                      orgId: "${toGlobalId('organizations', orgOne._key)}"
                    }
                  ) {
                    result {
                      ... on RemoveUserFromOrgResult {
                        status
                        user {
                          id
                          userName
                        }
                      }
                      ... on AffiliationError {
                        code
                        description
                      }
                    }
                  }
                }
              `,
              null,
              {
                i18n,
                query,
                collections,
                transaction,
                userKey: admin._key,
                auth: {
                  checkPermission: checkPermission({
                    i18n,
                    userKey: admin._key,
                    query,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: admin._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: admin._key,
                      i18n,
                    }),
                  }),
                  verifiedRequired: verifiedRequired({ i18n }),
                  tfaRequired: tfaRequired({ i18n }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    userKey: admin._key,
                    i18n,
                  }),
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: admin._key,
                    i18n,
                  }),
                },
                validators: { cleanseInput },
              },
            )

            const expectedResponse = {
              data: {
                removeUserFromOrg: {
                  result: {
                    status:
                      "L'utilisateur a été retiré de l'organisation avec succès.",
                    user: {
                      id: toGlobalId('user', user._key),
                      userName: 'test.account@istio.actually.exists',
                    },
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${admin._key} successfully removed user: ${user._key} from org: ${orgOne._key}.`,
            ])
          })
        })
      })
      describe('super admin can remove a user from any org', () => {
        it.skip('removes the user from the org', async () => {
          await graphql(
            schema,
            `
              mutation {
                removeUserFromOrg (
                  input: {
                    userId: "${toGlobalId('users', user._key)}"
                    orgId: "${toGlobalId('organizations', orgOne._key)}"
                  }
                ) {
                  result {
                    ... on RemoveUserFromOrgResult {
                      status
                      user {
                        id
                        userName
                      }
                    }
                    ... on AffiliationError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              query,
              collections,
              transaction,
              userKey: admin._key,
              auth: {
                checkPermission: checkPermission({
                  i18n,
                  userKey: admin._key,
                  query,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: admin._key,
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: admin._key,
                    i18n,
                  }),
                }),
                verifiedRequired: verifiedRequired({ i18n }),
                tfaRequired: tfaRequired({ i18n }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({
                  query,
                  language: 'en',
                  userKey: admin._key,
                  i18n,
                }),
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: admin._key,
                  i18n,
                }),
              },
              validators: { cleanseInput },
            },
          )

          const loader = loadAffiliationByKey({
            query,
            userKey: admin._key,
            i18n,
          })

          const data = await loader.load(affiliation._key)

          expect(data).toEqual(undefined)
          expect(consoleOutput).toEqual([
            `User: ${admin._key} successfully removed user: ${user._key} from org: ${orgOne._key}.`,
          ])
        })
        describe('users language is set to english', () => {
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
          it('returns a status message', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  removeUserFromOrg (
                    input: {
                      userId: "${toGlobalId('users', user._key)}"
                      orgId: "${toGlobalId('organizations', orgOne._key)}"
                    }
                  ) {
                    result {
                      ... on RemoveUserFromOrgResult {
                        status
                        user {
                          id
                          userName
                        }
                      }
                      ... on AffiliationError {
                        code
                        description
                      }
                    }
                  }
                }
              `,
              null,
              {
                i18n,
                query,
                collections,
                transaction,
                userKey: admin._key,
                auth: {
                  checkPermission: checkPermission({
                    i18n,
                    userKey: admin._key,
                    query,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: admin._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: admin._key,
                      i18n,
                    }),
                  }),
                  verifiedRequired: verifiedRequired({ i18n }),
                  tfaRequired: tfaRequired({ i18n }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    userKey: admin._key,
                    i18n,
                  }),
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: admin._key,
                    i18n,
                  }),
                },
                validators: { cleanseInput },
              },
            )

            const expectedResponse = {
              data: {
                removeUserFromOrg: {
                  result: {
                    status: 'Successfully removed user from organization.',
                    user: {
                      id: toGlobalId('user', user._key),
                      userName: 'test.account@istio.actually.exists',
                    },
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${admin._key} successfully removed user: ${user._key} from org: ${orgOne._key}.`,
            ])
          })
        })
        describe('users language is set to french', () => {
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
          it('returns a status message', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  removeUserFromOrg (
                    input: {
                      userId: "${toGlobalId('users', user._key)}"
                      orgId: "${toGlobalId('organizations', orgOne._key)}"
                    }
                  ) {
                    result {
                      ... on RemoveUserFromOrgResult {
                        status
                        user {
                          id
                          userName
                        }
                      }
                      ... on AffiliationError {
                        code
                        description
                      }
                    }
                  }
                }
              `,
              null,
              {
                i18n,
                query,
                collections,
                transaction,
                userKey: admin._key,
                auth: {
                  checkPermission: checkPermission({
                    i18n,
                    userKey: admin._key,
                    query,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: admin._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: admin._key,
                      i18n,
                    }),
                  }),
                  verifiedRequired: verifiedRequired({ i18n }),
                  tfaRequired: tfaRequired({ i18n }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    userKey: admin._key,
                    i18n,
                  }),
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: admin._key,
                    i18n,
                  }),
                },
                validators: { cleanseInput },
              },
            )

            const expectedResponse = {
              data: {
                removeUserFromOrg: {
                  result: {
                    status:
                      "L'utilisateur a été retiré de l'organisation avec succès.",
                    user: {
                      id: toGlobalId('user', user._key),
                      userName: 'test.account@istio.actually.exists',
                    },
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${admin._key} successfully removed user: ${user._key} from org: ${orgOne._key}.`,
            ])
          })
        })
      })
    })
    describe('user is an org admin', () => {
      beforeEach(async () => {
        orgOne = await collections.organizations.save(orgOneData)
        admin = await collections.users.save(adminData)
        user = await collections.users.save(userData)

        await collections.affiliations.save({
          _from: orgOne._id,
          _to: admin._id,
          permission: 'admin',
        })
        affiliation = await collections.affiliations.save({
          _from: orgOne._id,
          _to: user._id,
          permission: 'user',
        })
      })
      describe('admin can remove a user from the shared org', () => {
        it('removes the user from the org', async () => {
          await graphql(
            schema,
            `
              mutation {
                removeUserFromOrg (
                  input: {
                    userId: "${toGlobalId('users', user._key)}"
                    orgId: "${toGlobalId('organizations', orgOne._key)}"
                  }
                ) {
                  result {
                    ... on RemoveUserFromOrgResult {
                      status
                      user {
                        id
                        userName
                      }
                    }
                    ... on AffiliationError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              query,
              collections,
              transaction,
              userKey: admin._key,
              auth: {
                checkPermission: checkPermission({
                  i18n,
                  userKey: admin._key,
                  query,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: admin._key,
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: admin._key,
                    i18n,
                  }),
                }),
                verifiedRequired: verifiedRequired({ i18n }),
                tfaRequired: tfaRequired({ i18n }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({
                  query,
                  language: 'en',
                  userKey: admin._key,
                  i18n,
                }),
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: admin._key,
                  i18n,
                }),
              },
              validators: { cleanseInput },
            },
          )

          const loader = loadAffiliationByKey({
            query,
            userKey: admin._key,
            i18n,
          })

          const data = await loader.load(affiliation._key)

          expect(data).toEqual(undefined)
          expect(consoleOutput).toEqual([
            `User: ${admin._key} successfully removed user: ${user._key} from org: ${orgOne._key}.`,
          ])
        })
        describe('users language is set to english', () => {
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
          it('returns a status message', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  removeUserFromOrg (
                    input: {
                      userId: "${toGlobalId('users', user._key)}"
                      orgId: "${toGlobalId('organizations', orgOne._key)}"
                    }
                  ) {
                    result {
                      ... on RemoveUserFromOrgResult {
                        status
                        user {
                          id
                          userName
                        }
                      }
                      ... on AffiliationError {
                        code
                        description
                      }
                    }
                  }
                }
              `,
              null,
              {
                i18n,
                query,
                collections,
                transaction,
                userKey: admin._key,
                auth: {
                  checkPermission: checkPermission({
                    i18n,
                    userKey: admin._key,
                    query,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: admin._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: admin._key,
                      i18n,
                    }),
                  }),
                  verifiedRequired: verifiedRequired({ i18n }),
                  tfaRequired: tfaRequired({ i18n }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    userKey: admin._key,
                    i18n,
                  }),
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: admin._key,
                    i18n,
                  }),
                },
                validators: { cleanseInput },
              },
            )

            const expectedResponse = {
              data: {
                removeUserFromOrg: {
                  result: {
                    status: 'Successfully removed user from organization.',
                    user: {
                      id: toGlobalId('user', user._key),
                      userName: 'test.account@istio.actually.exists',
                    },
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${admin._key} successfully removed user: ${user._key} from org: ${orgOne._key}.`,
            ])
          })
        })
        describe('users language is set to french', () => {
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
          it('returns a status message', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  removeUserFromOrg (
                    input: {
                      userId: "${toGlobalId('users', user._key)}"
                      orgId: "${toGlobalId('organizations', orgOne._key)}"
                    }
                  ) {
                    result {
                      ... on RemoveUserFromOrgResult {
                        status
                        user {
                          id
                          userName
                        }
                      }
                      ... on AffiliationError {
                        code
                        description
                      }
                    }
                  }
                }
              `,
              null,
              {
                i18n,
                query,
                collections,
                transaction,
                userKey: admin._key,
                auth: {
                  checkPermission: checkPermission({
                    i18n,
                    userKey: admin._key,
                    query,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: admin._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: admin._key,
                      i18n,
                    }),
                  }),
                  verifiedRequired: verifiedRequired({ i18n }),
                  tfaRequired: tfaRequired({ i18n }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    userKey: admin._key,
                    i18n,
                  }),
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: admin._key,
                    i18n,
                  }),
                },
                validators: { cleanseInput },
              },
            )

            const expectedResponse = {
              data: {
                removeUserFromOrg: {
                  result: {
                    status:
                      "L'utilisateur a été retiré de l'organisation avec succès.",
                    user: {
                      id: toGlobalId('user', user._key),
                      userName: 'test.account@istio.actually.exists',
                    },
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${admin._key} successfully removed user: ${user._key} from org: ${orgOne._key}.`,
            ])
          })
        })
      })
    })
  })
  describe('users language is set to english', () => {
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
    describe('given an unsuccessful removal', () => {
      describe('org is not found', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                removeUserFromOrg (
                  input: {
                    userId: "${toGlobalId('users', 456)}"
                    orgId: "${toGlobalId('organizations', 12345)}"
                  }
                ) {
                  result {
                    ... on RemoveUserFromOrgResult {
                      status
                      user {
                        id
                        userName
                      }
                    }
                    ... on AffiliationError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              query,
              collections,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn().mockReturnValue(),
                userRequired: jest.fn().mockReturnValue({
                  _key: '123',
                }),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue(undefined),
                },
                loadUserByKey: {
                  load: jest.fn(),
                },
              },
              validators: { cleanseInput },
            },
          )

          const error = {
            data: {
              removeUserFromOrg: {
                result: {
                  code: 400,
                  description:
                    'Unable to remove user from unknown organization.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to remove user: 456 from org: 12345, however no org with that id could be found.`,
          ])
        })
      })
      describe('requesting user is not an admin', () => {
        it('returns an error message', async () => {
          const mockedCursor = {
            count: 1,
            next: jest.fn().mockReturnValue({
              permission: 'user',
            }),
          }
          const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

          const response = await graphql(
            schema,
            `
              mutation {
                removeUserFromOrg (
                  input: {
                    userId: "${toGlobalId('users', 456)}"
                    orgId: "${toGlobalId('organizations', 12345)}"
                  }
                ) {
                  result {
                    ... on RemoveUserFromOrgResult {
                      status
                      user {
                        id
                        userName
                      }
                    }
                    ... on AffiliationError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              query: mockedQuery,
              collections,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn().mockReturnValue('user'),
                userRequired: jest.fn().mockReturnValue({
                  _key: '123',
                }),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({ _key: 12345 }),
                },
                loadUserByKey: {
                  load: jest.fn().mockReturnValue({
                    _key: 456,
                  }),
                },
              },
              validators: { cleanseInput },
            },
          )

          const error = {
            data: {
              removeUserFromOrg: {
                result: {
                  code: 400,
                  description: 'Unable to remove user from organization.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to remove user: 456 from org: 12345, however they do not have the permission to remove users.`,
          ])
        })
      })
      describe('requesting user is an admin for another org', () => {
        it('returns an error message', async () => {
          const mockedCursor = {
            count: 1,
            next: jest.fn().mockReturnValue({
              permission: 'user',
            }),
          }
          const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

          const response = await graphql(
            schema,
            `
              mutation {
                removeUserFromOrg (
                  input: {
                    userId: "${toGlobalId('users', 456)}"
                    orgId: "${toGlobalId('organizations', 12345)}"
                  }
                ) {
                  result {
                    ... on RemoveUserFromOrgResult {
                      status
                      user {
                        id
                        userName
                      }
                    }
                    ... on AffiliationError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              query: mockedQuery,
              collections,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn().mockReturnValue(undefined),
                userRequired: jest.fn().mockReturnValue({
                  _key: '123',
                }),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({ _key: 12345 }),
                },
                loadUserByKey: {
                  load: jest.fn().mockReturnValue({
                    _key: 456,
                  }),
                },
              },
              validators: { cleanseInput },
            },
          )

          const error = {
            data: {
              removeUserFromOrg: {
                result: {
                  code: 400,
                  description: 'Unable to remove user from organization.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to remove user: 456 from org: 12345, however they do not have the permission to remove users.`,
          ])
        })
      })
      describe('requested user is not found', () => {
        it('returns an error message', async () => {
          const mockedCursor = {
            count: 1,
            next: jest.fn().mockReturnValue({
              permission: 'admin',
            }),
          }
          const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

          const response = await graphql(
            schema,
            `
              mutation {
                removeUserFromOrg (
                  input: {
                    userId: "${toGlobalId('users', 456)}"
                    orgId: "${toGlobalId('organizations', 12345)}"
                  }
                ) {
                  result {
                    ... on RemoveUserFromOrgResult {
                      status
                      user {
                        id
                        userName
                      }
                    }
                    ... on AffiliationError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              query: mockedQuery,
              collections,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn().mockReturnValue('admin'),
                userRequired: jest.fn().mockReturnValue({
                  _key: '123',
                }),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({ _key: 12345 }),
                },
                loadUserByKey: {
                  load: jest.fn().mockReturnValue(undefined),
                },
              },
              validators: { cleanseInput },
            },
          )

          const error = {
            data: {
              removeUserFromOrg: {
                result: {
                  code: 400,
                  description:
                    'Unable to remove unknown user from organization.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to remove user: 456 from org: 12345, however no user with that id could be found.`,
          ])
        })
      })
      describe('requested user does not belong to this org', () => {
        it('returns an error', async () => {
          const mockedCursor = {
            count: 0,
          }
          const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

          const response = await graphql(
            schema,
            `
              mutation {
                removeUserFromOrg (
                  input: {
                    userId: "${toGlobalId('users', 456)}"
                    orgId: "${toGlobalId('organizations', 12345)}"
                  }
                ) {
                  result {
                    ... on RemoveUserFromOrgResult {
                      status
                      user {
                        id
                        userName
                      }
                    }
                    ... on AffiliationError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              query: mockedQuery,
              collections,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn().mockReturnValue('super_admin'),
                userRequired: jest.fn().mockReturnValue({
                  _key: '123',
                }),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({ _key: 12345 }),
                },
                loadUserByKey: {
                  load: jest.fn().mockReturnValue({
                    _key: 456,
                  }),
                },
              },
              validators: { cleanseInput },
            },
          )

          const error = {
            data: {
              removeUserFromOrg: {
                result: {
                  code: 400,
                  description:
                    'Unable to remove a user that already does not belong to this organization.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to remove user: 456, but they do not have any affiliations to org: 12345.`,
          ])
        })
      })
      describe('super admin attempts to remove another super admin', () => {
        it('returns an error message', async () => {
          const mockedCursor = {
            count: 1,
            next: jest.fn().mockReturnValue({
              permission: 'super_admin',
            }),
          }
          const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

          const response = await graphql(
            schema,
            `
              mutation {
                removeUserFromOrg (
                  input: {
                    userId: "${toGlobalId('users', 456)}"
                    orgId: "${toGlobalId('organizations', 12345)}"
                  }
                ) {
                  result {
                    ... on RemoveUserFromOrgResult {
                      status
                      user {
                        id
                        userName
                      }
                    }
                    ... on AffiliationError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              query: mockedQuery,
              collections,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn().mockReturnValue('super_admin'),
                userRequired: jest.fn().mockReturnValue({
                  _key: '123',
                }),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({ _key: 12345 }),
                },
                loadUserByKey: {
                  load: jest.fn().mockReturnValue({
                    _key: 456,
                  }),
                },
              },
              validators: { cleanseInput },
            },
          )

          const error = {
            data: {
              removeUserFromOrg: {
                result: {
                  code: 400,
                  description:
                    'Permission Denied: Please contact organization admin for help with removing users.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to remove user: 456 from org: 12345, but they do not have the right permission.`,
          ])
        })
      })
      describe('admin attempts to remove another admin', () => {
        it('returns an error message', async () => {
          const mockedCursor = {
            count: 1,
            next: jest.fn().mockReturnValue({
              permission: 'admin',
            }),
          }
          const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

          const response = await graphql(
            schema,
            `
              mutation {
                removeUserFromOrg (
                  input: {
                    userId: "${toGlobalId('users', 456)}"
                    orgId: "${toGlobalId('organizations', 12345)}"
                  }
                ) {
                  result {
                    ... on RemoveUserFromOrgResult {
                      status
                      user {
                        id
                        userName
                      }
                    }
                    ... on AffiliationError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              query: mockedQuery,
              collections,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn().mockReturnValue('admin'),
                userRequired: jest.fn().mockReturnValue({
                  _key: '123',
                }),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({ _key: 12345 }),
                },
                loadUserByKey: {
                  load: jest.fn().mockReturnValue({
                    _key: 456,
                  }),
                },
              },
              validators: { cleanseInput },
            },
          )

          const error = {
            data: {
              removeUserFromOrg: {
                result: {
                  code: 400,
                  description:
                    'Permission Denied: Please contact organization admin for help with removing users.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to remove user: 456 from org: 12345, but they do not have the right permission.`,
          ])
        })
      })
    })
    describe('database error occurs', () => {
      describe('when checking requested users permission in requested org', () => {
        it('throws an error', async () => {
          const mockedQuery = jest
            .fn()
            .mockRejectedValue(new Error('database error'))

          const response = await graphql(
            schema,
            `
              mutation {
                removeUserFromOrg (
                  input: {
                    userId: "${toGlobalId('users', 456)}"
                    orgId: "${toGlobalId('organizations', 12345)}"
                  }
                ) {
                  result {
                    ... on RemoveUserFromOrgResult {
                      status
                      user {
                        id
                        userName
                      }
                    }
                    ... on AffiliationError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              query: mockedQuery,
              collections,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn().mockReturnValue('admin'),
                userRequired: jest.fn().mockReturnValue({
                  _key: '123',
                }),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({ _key: 12345 }),
                },
                loadUserByKey: {
                  load: jest.fn().mockReturnValue({
                    _key: 456,
                  }),
                },
              },
              validators: { cleanseInput },
            },
          )

          const error = [
            new GraphQLError(
              'Unable to remove user from this organization. Please try again.',
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred when user: 123 attempted to check the current permission of user: 456 to see if they could be removed: Error: database error`,
          ])
        })
      })
    })
    describe('cursor error occurs', () => {
      describe('when gathering requested users permission in requested org', () => {
        it('throws an error', async () => {
          const mockedCursor = {
            count: 1,
            next: jest.fn().mockRejectedValue(new Error('cursor error')),
          }
          const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

          const response = await graphql(
            schema,
            `
              mutation {
                removeUserFromOrg (
                  input: {
                    userId: "${toGlobalId('users', 456)}"
                    orgId: "${toGlobalId('organizations', 12345)}"
                  }
                ) {
                  result {
                    ... on RemoveUserFromOrgResult {
                      status
                      user {
                        id
                        userName
                      }
                    }
                    ... on AffiliationError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              query: mockedQuery,
              collections,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn().mockReturnValue('admin'),
                userRequired: jest.fn().mockReturnValue({
                  _key: '123',
                }),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({ _key: 12345 }),
                },
                loadUserByKey: {
                  load: jest.fn().mockReturnValue({
                    _key: 456,
                  }),
                },
              },
              validators: { cleanseInput },
            },
          )

          const error = [
            new GraphQLError(
              'Unable to remove user from this organization. Please try again.',
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Cursor error occurred when user: 123 attempted to check the current permission of user: 456 to see if they could be removed: Error: cursor error`,
          ])
        })
      })
    })
    describe('transaction step error occurs', () => {
      describe('when removing affiliation', () => {
        it('throws an error', async () => {
          const mockedCursor = {
            count: 1,
            next: jest.fn().mockReturnValue({ permission: 'user' }),
          }
          const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

          const mockedTransaction = jest.fn().mockReturnValue({
            step: jest.fn().mockRejectedValue(new Error('trx step error')),
          })

          const response = await graphql(
            schema,
            `
              mutation {
                removeUserFromOrg (
                  input: {
                    userId: "${toGlobalId('users', 456)}"
                    orgId: "${toGlobalId('organizations', 12345)}"
                  }
                ) {
                  result {
                    ... on RemoveUserFromOrgResult {
                      status
                      user {
                        id
                        userName
                      }
                    }
                    ... on AffiliationError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              query: mockedQuery,
              collections,
              transaction: mockedTransaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn().mockReturnValue('admin'),
                userRequired: jest.fn().mockReturnValue({
                  _key: '123',
                }),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({ _key: 12345 }),
                },
                loadUserByKey: {
                  load: jest.fn().mockReturnValue({
                    _key: 456,
                  }),
                },
              },
              validators: { cleanseInput },
            },
          )

          const error = [
            new GraphQLError(
              'Unable to remove user from this organization. Please try again.',
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Trx step error occurred when user: 123 attempted to remove user: 456 from org: 12345, error: Error: trx step error`,
          ])
        })
      })
    })
    describe('transaction commit error occurs', () => {
      it('throws an error', async () => {
        const mockedCursor = {
          count: 1,
          next: jest.fn().mockReturnValue({ permission: 'user' }),
        }
        const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

        const mockedTransaction = jest.fn().mockReturnValue({
          step: jest.fn().mockReturnValue(),
          commit: jest.fn().mockRejectedValue(new Error('trx commit error')),
        })

        const response = await graphql(
          schema,
          `
            mutation {
              removeUserFromOrg (
                input: {
                  userId: "${toGlobalId('users', 456)}"
                  orgId: "${toGlobalId('organizations', 12345)}"
                }
              ) {
                result {
                  ... on RemoveUserFromOrgResult {
                    status
                    user {
                      id
                      userName
                    }
                  }
                  ... on AffiliationError {
                    code
                    description
                  }
                }
              }
            }
          `,
          null,
          {
            i18n,
            query: mockedQuery,
            collections,
            transaction: mockedTransaction,
            userKey: 123,
            auth: {
              checkPermission: jest.fn().mockReturnValue('admin'),
              userRequired: jest.fn().mockReturnValue({
                _key: '123',
              }),
              verifiedRequired: jest.fn(),
              tfaRequired: jest.fn(),
            },
            loaders: {
              loadOrgByKey: {
                load: jest.fn().mockReturnValue({ _key: 12345 }),
              },
              loadUserByKey: {
                load: jest.fn().mockReturnValue({
                  _key: 456,
                }),
              },
            },
            validators: { cleanseInput },
          },
        )

        const error = [
          new GraphQLError(
            'Unable to remove user from this organization. Please try again.',
          ),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `Trx commit error occurred when user: 123 attempted to remove user: 456 from org: 12345, error: Error: trx commit error`,
        ])
      })
    })
  })
  describe('users language is set to french', () => {
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
    describe('given an unsuccessful removal', () => {
      describe('org is not found', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                removeUserFromOrg (
                  input: {
                    userId: "${toGlobalId('users', 456)}"
                    orgId: "${toGlobalId('organizations', 12345)}"
                  }
                ) {
                  result {
                    ... on RemoveUserFromOrgResult {
                      status
                      user {
                        id
                        userName
                      }
                    }
                    ... on AffiliationError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              query,
              collections,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn().mockReturnValue(),
                userRequired: jest.fn().mockReturnValue({
                  _key: '123',
                }),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue(undefined),
                },
                loadUserByKey: {
                  load: jest.fn(),
                },
              },
              validators: { cleanseInput },
            },
          )

          const error = {
            data: {
              removeUserFromOrg: {
                result: {
                  code: 400,
                  description:
                    "Impossible de supprimer un utilisateur d'une organisation inconnue.",
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to remove user: 456 from org: 12345, however no org with that id could be found.`,
          ])
        })
      })
      describe('requesting user is not an admin', () => {
        it('returns an error message', async () => {
          const mockedCursor = {
            count: 1,
            next: jest.fn().mockReturnValue({
              permission: 'user',
            }),
          }
          const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

          const response = await graphql(
            schema,
            `
              mutation {
                removeUserFromOrg (
                  input: {
                    userId: "${toGlobalId('users', 456)}"
                    orgId: "${toGlobalId('organizations', 12345)}"
                  }
                ) {
                  result {
                    ... on RemoveUserFromOrgResult {
                      status
                      user {
                        id
                        userName
                      }
                    }
                    ... on AffiliationError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              query: mockedQuery,
              collections,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn().mockReturnValue('user'),
                userRequired: jest.fn().mockReturnValue({
                  _key: '123',
                }),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({ _key: 12345 }),
                },
                loadUserByKey: {
                  load: jest.fn().mockReturnValue({
                    _key: 456,
                  }),
                },
              },
              validators: { cleanseInput },
            },
          )

          const error = {
            data: {
              removeUserFromOrg: {
                result: {
                  code: 400,
                  description:
                    "Impossible de supprimer un utilisateur de l'organisation.",
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to remove user: 456 from org: 12345, however they do not have the permission to remove users.`,
          ])
        })
      })
      describe('requesting user is an admin for another org', () => {
        it('returns an error message', async () => {
          const mockedCursor = {
            count: 1,
            next: jest.fn().mockReturnValue({
              permission: 'user',
            }),
          }
          const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

          const response = await graphql(
            schema,
            `
              mutation {
                removeUserFromOrg (
                  input: {
                    userId: "${toGlobalId('users', 456)}"
                    orgId: "${toGlobalId('organizations', 12345)}"
                  }
                ) {
                  result {
                    ... on RemoveUserFromOrgResult {
                      status
                      user {
                        id
                        userName
                      }
                    }
                    ... on AffiliationError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              query: mockedQuery,
              collections,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn().mockReturnValue(undefined),
                userRequired: jest.fn().mockReturnValue({
                  _key: '123',
                }),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({ _key: 12345 }),
                },
                loadUserByKey: {
                  load: jest.fn().mockReturnValue({
                    _key: 456,
                  }),
                },
              },
              validators: { cleanseInput },
            },
          )

          const error = {
            data: {
              removeUserFromOrg: {
                result: {
                  code: 400,
                  description:
                    "Impossible de supprimer un utilisateur de l'organisation.",
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to remove user: 456 from org: 12345, however they do not have the permission to remove users.`,
          ])
        })
      })
      describe('requested user is not found', () => {
        it('returns an error message', async () => {
          const mockedCursor = {
            count: 1,
            next: jest.fn().mockReturnValue({
              permission: 'admin',
            }),
          }
          const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

          const response = await graphql(
            schema,
            `
              mutation {
                removeUserFromOrg (
                  input: {
                    userId: "${toGlobalId('users', 456)}"
                    orgId: "${toGlobalId('organizations', 12345)}"
                  }
                ) {
                  result {
                    ... on RemoveUserFromOrgResult {
                      status
                      user {
                        id
                        userName
                      }
                    }
                    ... on AffiliationError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              query: mockedQuery,
              collections,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn().mockReturnValue('admin'),
                userRequired: jest.fn().mockReturnValue({
                  _key: '123',
                }),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({ _key: 12345 }),
                },
                loadUserByKey: {
                  load: jest.fn().mockReturnValue(undefined),
                },
              },
              validators: { cleanseInput },
            },
          )

          const error = {
            data: {
              removeUserFromOrg: {
                result: {
                  code: 400,
                  description:
                    "Impossible de supprimer un utilisateur inconnu de l'organisation.",
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to remove user: 456 from org: 12345, however no user with that id could be found.`,
          ])
        })
      })
      describe('requested user does not belong to this org', () => {
        it('returns an error', async () => {
          const mockedCursor = {
            count: 0,
          }
          const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

          const response = await graphql(
            schema,
            `
              mutation {
                removeUserFromOrg (
                  input: {
                    userId: "${toGlobalId('users', 456)}"
                    orgId: "${toGlobalId('organizations', 12345)}"
                  }
                ) {
                  result {
                    ... on RemoveUserFromOrgResult {
                      status
                      user {
                        id
                        userName
                      }
                    }
                    ... on AffiliationError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              query: mockedQuery,
              collections,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn().mockReturnValue('super_admin'),
                userRequired: jest.fn().mockReturnValue({
                  _key: '123',
                }),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({ _key: 12345 }),
                },
                loadUserByKey: {
                  load: jest.fn().mockReturnValue({
                    _key: 456,
                  }),
                },
              },
              validators: { cleanseInput },
            },
          )

          const error = {
            data: {
              removeUserFromOrg: {
                result: {
                  code: 400,
                  description:
                    "Impossible de supprimer un utilisateur qui n'appartient déjà plus à cette organisation.",
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to remove user: 456, but they do not have any affiliations to org: 12345.`,
          ])
        })
      })
      describe('super admin attempts to remove another super admin', () => {
        it('returns an error message', async () => {
          const mockedCursor = {
            count: 1,
            next: jest.fn().mockReturnValue({
              permission: 'super_admin',
            }),
          }
          const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

          const response = await graphql(
            schema,
            `
              mutation {
                removeUserFromOrg (
                  input: {
                    userId: "${toGlobalId('users', 456)}"
                    orgId: "${toGlobalId('organizations', 12345)}"
                  }
                ) {
                  result {
                    ... on RemoveUserFromOrgResult {
                      status
                      user {
                        id
                        userName
                      }
                    }
                    ... on AffiliationError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              query: mockedQuery,
              collections,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn().mockReturnValue('super_admin'),
                userRequired: jest.fn().mockReturnValue({
                  _key: '123',
                }),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({ _key: 12345 }),
                },
                loadUserByKey: {
                  load: jest.fn().mockReturnValue({
                    _key: 456,
                  }),
                },
              },
              validators: { cleanseInput },
            },
          )

          const error = {
            data: {
              removeUserFromOrg: {
                result: {
                  code: 400,
                  description:
                    "Autorisation refusée : Veuillez contacter l'administrateur de l'organisation pour obtenir de l'aide sur la suppression des utilisateurs.",
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to remove user: 456 from org: 12345, but they do not have the right permission.`,
          ])
        })
      })
      describe('admin attempts to remove another admin', () => {
        it('returns an error message', async () => {
          const mockedCursor = {
            count: 1,
            next: jest.fn().mockReturnValue({
              permission: 'admin',
            }),
          }
          const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

          const response = await graphql(
            schema,
            `
              mutation {
                removeUserFromOrg (
                  input: {
                    userId: "${toGlobalId('users', 456)}"
                    orgId: "${toGlobalId('organizations', 12345)}"
                  }
                ) {
                  result {
                    ... on RemoveUserFromOrgResult {
                      status
                      user {
                        id
                        userName
                      }
                    }
                    ... on AffiliationError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              query: mockedQuery,
              collections,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn().mockReturnValue('admin'),
                userRequired: jest.fn().mockReturnValue({
                  _key: '123',
                }),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({ _key: 12345 }),
                },
                loadUserByKey: {
                  load: jest.fn().mockReturnValue({
                    _key: 456,
                  }),
                },
              },
              validators: { cleanseInput },
            },
          )

          const error = {
            data: {
              removeUserFromOrg: {
                result: {
                  code: 400,
                  description:
                    "Autorisation refusée : Veuillez contacter l'administrateur de l'organisation pour obtenir de l'aide sur la suppression des utilisateurs.",
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to remove user: 456 from org: 12345, but they do not have the right permission.`,
          ])
        })
      })
    })
    describe('database error occurs', () => {
      describe('when checking requested users permission in requested org', () => {
        it('throws an error', async () => {
          const mockedQuery = jest
            .fn()
            .mockRejectedValue(new Error('database error'))

          const response = await graphql(
            schema,
            `
              mutation {
                removeUserFromOrg (
                  input: {
                    userId: "${toGlobalId('users', 456)}"
                    orgId: "${toGlobalId('organizations', 12345)}"
                  }
                ) {
                  result {
                    ... on RemoveUserFromOrgResult {
                      status
                      user {
                        id
                        userName
                      }
                    }
                    ... on AffiliationError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              query: mockedQuery,
              collections,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn().mockReturnValue('admin'),
                userRequired: jest.fn().mockReturnValue({
                  _key: '123',
                }),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({ _key: 12345 }),
                },
                loadUserByKey: {
                  load: jest.fn().mockReturnValue({
                    _key: 456,
                  }),
                },
              },
              validators: { cleanseInput },
            },
          )

          const error = [
            new GraphQLError(
              "Impossible de supprimer l'utilisateur de cette organisation. Veuillez réessayer.",
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred when user: 123 attempted to check the current permission of user: 456 to see if they could be removed: Error: database error`,
          ])
        })
      })
    })
    describe('cursor error occurs', () => {
      describe('when gathering requested users permission in requested org', () => {
        it('throws an error', async () => {
          const mockedCursor = {
            count: 1,
            next: jest.fn().mockRejectedValue(new Error('cursor error')),
          }
          const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

          const response = await graphql(
            schema,
            `
              mutation {
                removeUserFromOrg (
                  input: {
                    userId: "${toGlobalId('users', 456)}"
                    orgId: "${toGlobalId('organizations', 12345)}"
                  }
                ) {
                  result {
                    ... on RemoveUserFromOrgResult {
                      status
                      user {
                        id
                        userName
                      }
                    }
                    ... on AffiliationError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              query: mockedQuery,
              collections,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn().mockReturnValue('admin'),
                userRequired: jest.fn().mockReturnValue({
                  _key: '123',
                }),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({ _key: 12345 }),
                },
                loadUserByKey: {
                  load: jest.fn().mockReturnValue({
                    _key: 456,
                  }),
                },
              },
              validators: { cleanseInput },
            },
          )

          const error = [
            new GraphQLError(
              "Impossible de supprimer l'utilisateur de cette organisation. Veuillez réessayer.",
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Cursor error occurred when user: 123 attempted to check the current permission of user: 456 to see if they could be removed: Error: cursor error`,
          ])
        })
      })
    })
    describe('transaction step error occurs', () => {
      describe('when removing affiliation', () => {
        it('throws an error', async () => {
          const mockedCursor = {
            count: 1,
            next: jest.fn().mockReturnValue({ permission: 'user' }),
          }
          const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

          const mockedTransaction = jest.fn().mockReturnValue({
            step: jest.fn().mockRejectedValue(new Error('trx step error')),
          })

          const response = await graphql(
            schema,
            `
              mutation {
                removeUserFromOrg (
                  input: {
                    userId: "${toGlobalId('users', 456)}"
                    orgId: "${toGlobalId('organizations', 12345)}"
                  }
                ) {
                  result {
                    ... on RemoveUserFromOrgResult {
                      status
                      user {
                        id
                        userName
                      }
                    }
                    ... on AffiliationError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              query: mockedQuery,
              collections,
              transaction: mockedTransaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn().mockReturnValue('admin'),
                userRequired: jest.fn().mockReturnValue({
                  _key: '123',
                }),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({ _key: 12345 }),
                },
                loadUserByKey: {
                  load: jest.fn().mockReturnValue({
                    _key: 456,
                  }),
                },
              },
              validators: { cleanseInput },
            },
          )

          const error = [
            new GraphQLError(
              "Impossible de supprimer l'utilisateur de cette organisation. Veuillez réessayer.",
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Trx step error occurred when user: 123 attempted to remove user: 456 from org: 12345, error: Error: trx step error`,
          ])
        })
      })
    })
    describe('transaction commit error occurs', () => {
      it('throws an error', async () => {
        const mockedCursor = {
          count: 1,
          next: jest.fn().mockReturnValue({ permission: 'user' }),
        }
        const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

        const mockedTransaction = jest.fn().mockReturnValue({
          step: jest.fn().mockReturnValue(),
          commit: jest.fn().mockRejectedValue(new Error('trx commit error')),
        })

        const response = await graphql(
          schema,
          `
            mutation {
              removeUserFromOrg (
                input: {
                  userId: "${toGlobalId('users', 456)}"
                  orgId: "${toGlobalId('organizations', 12345)}"
                }
              ) {
                result {
                  ... on RemoveUserFromOrgResult {
                    status
                    user {
                      id
                      userName
                    }
                  }
                  ... on AffiliationError {
                    code
                    description
                  }
                }
              }
            }
          `,
          null,
          {
            i18n,
            query: mockedQuery,
            collections,
            transaction: mockedTransaction,
            userKey: 123,
            auth: {
              checkPermission: jest.fn().mockReturnValue('admin'),
              userRequired: jest.fn().mockReturnValue({
                _key: '123',
              }),
              verifiedRequired: jest.fn(),
              tfaRequired: jest.fn(),
            },
            loaders: {
              loadOrgByKey: {
                load: jest.fn().mockReturnValue({ _key: 12345 }),
              },
              loadUserByKey: {
                load: jest.fn().mockReturnValue({
                  _key: 456,
                }),
              },
            },
            validators: { cleanseInput },
          },
        )

        const error = [
          new GraphQLError(
            "Impossible de supprimer l'utilisateur de cette organisation. Veuillez réessayer.",
          ),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `Trx commit error occurred when user: 123 attempted to remove user: 456 from org: 12345, error: Error: trx commit error`,
        ])
      })
    })
  })
})
