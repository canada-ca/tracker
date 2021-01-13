import { ArangoTools, dbNameFromFile } from 'arango-tools'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { setupI18n } from '@lingui/core'
import { makeMigrations } from '../../../../migrations'
import { createQuerySchema } from '../../../queries'
import { createMutationSchema } from '../../../mutations'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'

import bcrypt from 'bcrypt'
import { cleanseInput, slugify } from '../../../validators'
import { checkPermission, tokenize, userRequired } from '../../../auth'
import {
  orgLoaderByKey,
  userLoaderByKey,
  userLoaderByUserName,
} from '../../../loaders'
import { toGlobalId } from 'graphql-relay'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('updating an organization', () => {
  let query, drop, truncate, migrate, schema, collections, transaction

  beforeAll(async () => {
    // Create GQL Schema
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
  })

  let consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)
  beforeEach(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
    // Generate DB Items
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections, transaction } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
    await truncate()
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
    consoleOutput = []
  })

  afterEach(async () => {
    await drop()
  })

  describe('given a successful organization update', () => {
    beforeEach(async () => {
      await collections.organizations.save({
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
    describe('users permission level is super_admin', () => {
      let user, org
      beforeEach(async () => {
        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        const orgCursor = await query`
          FOR org IN organizations
            FILTER (LOWER("treasury-board-secretariat") == LOWER(TRANSLATE("en", org.orgDetails).slug))
            RETURN MERGE({ _id: org._id, _key: org._key, _rev: org._rev }, TRANSLATE("en", org.orgDetails))
        `
        user = await userCursor.next()
        org = await orgCursor.next()

        await query`
          INSERT {
            _from: ${org._id},
            _to: ${user._id},
            permission: "super_admin"
          } INTO affiliations
        `
      })
      describe('users language is english', () => {
        describe('updating the acronym', () => {
          it('returns the updated organization', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    acronymEN: "TEST"
                  }
                ) {
                  organization {
                    acronym
                    name
                    zone
                    sector
                    country
                    province
                    city
                  }
                }
              }
              `,
              null,
              {
                query,
                collections,
                transaction,
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
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const expectedResponse = {
              data: {
                updateOrganization: {
                  organization: {
                    acronym: 'TEST',
                    city: 'Ottawa',
                    country: 'Canada',
                    name: 'Treasury Board of Canada Secretariat',
                    province: 'Ontario',
                    sector: 'TBS',
                    zone: 'FED',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key}, successfully updated org ${org._key}.`,
            ])
          })
        })
        describe('updating the name', () => {
          it('returns the updated organization', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    nameEN: "Test"
                  }
                ) {
                  organization {
                    acronym
                    name
                    zone
                    sector
                    country
                    province
                    city
                  }
                }
              }
              `,
              null,
              {
                query,
                collections,
                transaction,
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
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const expectedResponse = {
              data: {
                updateOrganization: {
                  organization: {
                    acronym: 'TBS',
                    city: 'Ottawa',
                    country: 'Canada',
                    name: 'Test',
                    province: 'Ontario',
                    sector: 'TBS',
                    zone: 'FED',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key}, successfully updated org ${org._key}.`,
            ])
          })
        })
        describe('updating the zone', () => {
          it('returns the updated organization', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    zoneEN: "New Zone"
                  }
                ) {
                  organization {
                    acronym
                    name
                    zone
                    sector
                    country
                    province
                    city
                  }
                }
              }
              `,
              null,
              {
                query,
                collections,
                transaction,
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
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const expectedResponse = {
              data: {
                updateOrganization: {
                  organization: {
                    acronym: 'TBS',
                    city: 'Ottawa',
                    country: 'Canada',
                    name: 'Treasury Board of Canada Secretariat',
                    province: 'Ontario',
                    sector: 'TBS',
                    zone: 'New Zone',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key}, successfully updated org ${org._key}.`,
            ])
          })
        })
        describe('updating the sector', () => {
          it('returns the updated organization', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    sectorEN: "New Sector"
                  }
                ) {
                  organization {
                    acronym
                    name
                    zone
                    sector
                    country
                    province
                    city
                  }
                }
              }
              `,
              null,
              {
                query,
                collections,
                transaction,
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
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const expectedResponse = {
              data: {
                updateOrganization: {
                  organization: {
                    acronym: 'TBS',
                    city: 'Ottawa',
                    country: 'Canada',
                    name: 'Treasury Board of Canada Secretariat',
                    province: 'Ontario',
                    sector: 'New Sector',
                    zone: 'FED',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key}, successfully updated org ${org._key}.`,
            ])
          })
        })
        describe('updating the country', () => {
          it('returns the updated organization', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    countryEN: "A New Country"
                  }
                ) {
                  organization {
                    acronym
                    name
                    zone
                    sector
                    country
                    province
                    city
                  }
                }
              }
              `,
              null,
              {
                query,
                collections,
                transaction,
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
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const expectedResponse = {
              data: {
                updateOrganization: {
                  organization: {
                    acronym: 'TBS',
                    city: 'Ottawa',
                    country: 'A New Country',
                    name: 'Treasury Board of Canada Secretariat',
                    province: 'Ontario',
                    sector: 'TBS',
                    zone: 'FED',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key}, successfully updated org ${org._key}.`,
            ])
          })
        })
        describe('updating the province', () => {
          it('returns the updated organization', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    provinceEN: "A New Province"
                  }
                ) {
                  organization {
                    acronym
                    name
                    zone
                    sector
                    country
                    province
                    city
                  }
                }
              }
              `,
              null,
              {
                query,
                collections,
                transaction,
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
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const expectedResponse = {
              data: {
                updateOrganization: {
                  organization: {
                    acronym: 'TBS',
                    city: 'Ottawa',
                    country: 'Canada',
                    name: 'Treasury Board of Canada Secretariat',
                    province: 'A New Province',
                    sector: 'TBS',
                    zone: 'FED',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key}, successfully updated org ${org._key}.`,
            ])
          })
        })
        describe('updating the city', () => {
          it('returns the updated organization', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    cityEN: "A New City"
                  }
                ) {
                  organization {
                    acronym
                    name
                    zone
                    sector
                    country
                    province
                    city
                  }
                }
              }
              `,
              null,
              {
                query,
                collections,
                transaction,
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
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const expectedResponse = {
              data: {
                updateOrganization: {
                  organization: {
                    acronym: 'TBS',
                    city: 'A New City',
                    country: 'Canada',
                    name: 'Treasury Board of Canada Secretariat',
                    province: 'Ontario',
                    sector: 'TBS',
                    zone: 'FED',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key}, successfully updated org ${org._key}.`,
            ])
          })
        })
        describe('updating all organizational fields', () => {
          it('returns the updated organization', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    acronymEN: "NEW_ACRONYM"
                    nameEN: "New Name"
                    zoneEN: "New Zone"
                    sectorEN: "New Sector"
                    countryEN: "New Country"
                    provinceEN: "New Province"
                    cityEN: "New City"
                    acronymFR: "NOUVEL_ACRONYME"
                    nameFR: "Nouveau nom"
                    zoneFR: "Nouvelle zone"
                    sectorFR: "Nouveau secteur"
                    countryFR: "Nouveau pays"
                    provinceFR: "Nouvelle province"
                    cityFR: "Nouvelle ville"
                  }
                ) {
                  organization {
                    acronym
                    name
                    zone
                    sector
                    country
                    province
                    city
                  }
                }
              }
              `,
              null,
              {
                query,
                collections,
                transaction,
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
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const expectedResponse = {
              data: {
                updateOrganization: {
                  organization: {
                    acronym: 'NEW_ACRONYM',
                    name: 'New Name',
                    zone: 'New Zone',
                    sector: 'New Sector',
                    country: 'New Country',
                    province: 'New Province',
                    city: 'New City',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key}, successfully updated org ${org._key}.`,
            ])
          })
        })
      })
      describe('users language is french', () => {
        describe('updating the acronym', () => {
          it('returns the updated organization', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    acronymFR: "TEST"
                  }
                ) {
                  organization {
                    acronym
                    name
                    zone
                    sector
                    country
                    province
                    city
                  }
                }
              }
              `,
              null,
              {
                query,
                collections,
                transaction,
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
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const expectedResponse = {
              data: {
                updateOrganization: {
                  organization: {
                    acronym: 'TEST',
                    city: 'Ottawa',
                    country: 'Canada',
                    name: 'Secrétariat du Conseil Trésor du Canada',
                    province: 'Ontario',
                    sector: 'TBS',
                    zone: 'FED',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key}, successfully updated org ${org._key}.`,
            ])
          })
        })
        describe('updating the name', () => {
          it('returns the updated organization', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    nameFR: "Test"
                  }
                ) {
                  organization {
                    acronym
                    name
                    zone
                    sector
                    country
                    province
                    city
                  }
                }
              }
              `,
              null,
              {
                query,
                collections,
                transaction,
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
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const expectedResponse = {
              data: {
                updateOrganization: {
                  organization: {
                    acronym: 'SCT',
                    city: 'Ottawa',
                    country: 'Canada',
                    name: 'Test',
                    province: 'Ontario',
                    sector: 'TBS',
                    zone: 'FED',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key}, successfully updated org ${org._key}.`,
            ])
          })
        })
        describe('updating the zone', () => {
          it('returns the updated organization', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    zoneFR: "Secret Zone"
                  }
                ) {
                  organization {
                    acronym
                    name
                    zone
                    sector
                    country
                    province
                    city
                  }
                }
              }
              `,
              null,
              {
                query,
                collections,
                transaction,
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
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const expectedResponse = {
              data: {
                updateOrganization: {
                  organization: {
                    acronym: 'SCT',
                    name: 'Secrétariat du Conseil Trésor du Canada',
                    zone: 'Secret Zone',
                    sector: 'TBS',
                    country: 'Canada',
                    province: 'Ontario',
                    city: 'Ottawa',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key}, successfully updated org ${org._key}.`,
            ])
          })
        })
        describe('updating the sector', () => {
          it('returns the updated organization', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    sectorFR: "New Sector"
                  }
                ) {
                  organization {
                    acronym
                    name
                    zone
                    sector
                    country
                    province
                    city
                  }
                }
              }
              `,
              null,
              {
                query,
                collections,
                transaction,
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
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const expectedResponse = {
              data: {
                updateOrganization: {
                  organization: {
                    acronym: 'SCT',
                    name: 'Secrétariat du Conseil Trésor du Canada',
                    zone: 'FED',
                    sector: 'New Sector',
                    country: 'Canada',
                    province: 'Ontario',
                    city: 'Ottawa',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key}, successfully updated org ${org._key}.`,
            ])
          })
        })
        describe('updating the country', () => {
          it('returns the updated organization', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    countryFR: "A New Country"
                  }
                ) {
                  organization {
                    acronym
                    name
                    zone
                    sector
                    country
                    province
                    city
                  }
                }
              }
              `,
              null,
              {
                query,
                collections,
                transaction,
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
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const expectedResponse = {
              data: {
                updateOrganization: {
                  organization: {
                    acronym: 'SCT',
                    name: 'Secrétariat du Conseil Trésor du Canada',
                    zone: 'FED',
                    sector: 'TBS',
                    country: 'A New Country',
                    province: 'Ontario',
                    city: 'Ottawa',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key}, successfully updated org ${org._key}.`,
            ])
          })
        })
        describe('updating the province', () => {
          it('returns the updated organization', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    provinceFR: "A New Province"
                  }
                ) {
                  organization {
                    acronym
                    name
                    zone
                    sector
                    country
                    province
                    city
                  }
                }
              }
              `,
              null,
              {
                query,
                collections,
                transaction,
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
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const expectedResponse = {
              data: {
                updateOrganization: {
                  organization: {
                    acronym: 'SCT',
                    name: 'Secrétariat du Conseil Trésor du Canada',
                    zone: 'FED',
                    sector: 'TBS',
                    country: 'Canada',
                    province: 'A New Province',
                    city: 'Ottawa',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key}, successfully updated org ${org._key}.`,
            ])
          })
        })
        describe('updating the city', () => {
          it('returns the updated organization', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    cityFR: "A New City"
                  }
                ) {
                  organization {
                    acronym
                    name
                    zone
                    sector
                    country
                    province
                    city
                  }
                }
              }
              `,
              null,
              {
                query,
                collections,
                transaction,
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
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const expectedResponse = {
              data: {
                updateOrganization: {
                  organization: {
                    acronym: 'SCT',
                    city: 'A New City',
                    country: 'Canada',
                    name: 'Secrétariat du Conseil Trésor du Canada',
                    province: 'Ontario',
                    sector: 'TBS',
                    zone: 'FED',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key}, successfully updated org ${org._key}.`,
            ])
          })
        })
        describe('updating all organizational fields', () => {
          it('returns the updated organization', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    acronymEN: "NEW_ACRONYM"
                    nameEN: "New Name"
                    zoneEN: "New Zone"
                    sectorEN: "New Sector"
                    countryEN: "New Country"
                    provinceEN: "New Province"
                    cityEN: "New City"
                    acronymFR: "NOUVEL_ACRONYME"
                    nameFR: "Nouveau nom"
                    zoneFR: "Nouvelle zone"
                    sectorFR: "Nouveau secteur"
                    countryFR: "Nouveau pays"
                    provinceFR: "Nouvelle province"
                    cityFR: "Nouvelle ville"
                  }
                ) {
                  organization {
                    acronym
                    name
                    zone
                    sector
                    country
                    province
                    city
                  }
                }
              }
              `,
              null,
              {
                query,
                collections,
                transaction,
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
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const expectedResponse = {
              data: {
                updateOrganization: {
                  organization: {
                    acronym: 'NOUVEL_ACRONYME',
                    city: 'Nouvelle ville',
                    country: 'Nouveau pays',
                    name: 'Nouveau nom',
                    province: 'Nouvelle province',
                    sector: 'Nouveau secteur',
                    zone: 'Nouvelle zone',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key}, successfully updated org ${org._key}.`,
            ])
          })
        })
      })
    })
    describe('users permission level is admin', () => {
      let user, org
      beforeEach(async () => {
        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        const orgCursor = await query`
          FOR org IN organizations
            FILTER (LOWER("treasury-board-secretariat") == LOWER(TRANSLATE("en", org.orgDetails).slug))
            RETURN MERGE({ _id: org._id, _key: org._key, _rev: org._rev }, TRANSLATE("en", org.orgDetails))
        `
        user = await userCursor.next()
        org = await orgCursor.next()

        await query`
          INSERT {
            _from: ${org._id},
            _to: ${user._id},
            permission: "admin"
          } INTO affiliations
        `
      })
      describe('users language is english', () => {
        describe('updating the acronym', () => {
          it('returns the updated organization', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    acronymEN: "TEST"
                  }
                ) {
                  organization {
                    acronym
                    name
                    zone
                    sector
                    country
                    province
                    city
                  }
                }
              }
              `,
              null,
              {
                query,
                collections,
                transaction,
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
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const expectedResponse = {
              data: {
                updateOrganization: {
                  organization: {
                    acronym: 'TEST',
                    city: 'Ottawa',
                    country: 'Canada',
                    name: 'Treasury Board of Canada Secretariat',
                    province: 'Ontario',
                    sector: 'TBS',
                    zone: 'FED',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key}, successfully updated org ${org._key}.`,
            ])
          })
        })
        describe('updating the name', () => {
          it('returns the updated organization', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    nameEN: "Test"
                  }
                ) {
                  organization {
                    acronym
                    name
                    zone
                    sector
                    country
                    province
                    city
                  }
                }
              }
              `,
              null,
              {
                query,
                collections,
                transaction,
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
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const expectedResponse = {
              data: {
                updateOrganization: {
                  organization: {
                    acronym: 'TBS',
                    city: 'Ottawa',
                    country: 'Canada',
                    name: 'Test',
                    province: 'Ontario',
                    sector: 'TBS',
                    zone: 'FED',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key}, successfully updated org ${org._key}.`,
            ])
          })
        })
        describe('updating the zone', () => {
          it('returns the updated organization', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    zoneEN: "New Zone"
                  }
                ) {
                  organization {
                    acronym
                    name
                    zone
                    sector
                    country
                    province
                    city
                  }
                }
              }
              `,
              null,
              {
                query,
                collections,
                transaction,
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
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const expectedResponse = {
              data: {
                updateOrganization: {
                  organization: {
                    acronym: 'TBS',
                    city: 'Ottawa',
                    country: 'Canada',
                    name: 'Treasury Board of Canada Secretariat',
                    province: 'Ontario',
                    sector: 'TBS',
                    zone: 'New Zone',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key}, successfully updated org ${org._key}.`,
            ])
          })
        })
        describe('updating the sector', () => {
          it('returns the updated organization', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    sectorEN: "New Sector"
                  }
                ) {
                  organization {
                    acronym
                    name
                    zone
                    sector
                    country
                    province
                    city
                  }
                }
              }
              `,
              null,
              {
                query,
                collections,
                transaction,
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
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const expectedResponse = {
              data: {
                updateOrganization: {
                  organization: {
                    acronym: 'TBS',
                    city: 'Ottawa',
                    country: 'Canada',
                    name: 'Treasury Board of Canada Secretariat',
                    province: 'Ontario',
                    sector: 'New Sector',
                    zone: 'FED',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key}, successfully updated org ${org._key}.`,
            ])
          })
        })
        describe('updating the country', () => {
          it('returns the updated organization', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    countryEN: "A New Country"
                  }
                ) {
                  organization {
                    acronym
                    name
                    zone
                    sector
                    country
                    province
                    city
                  }
                }
              }
              `,
              null,
              {
                query,
                collections,
                transaction,
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
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const expectedResponse = {
              data: {
                updateOrganization: {
                  organization: {
                    acronym: 'TBS',
                    city: 'Ottawa',
                    country: 'A New Country',
                    name: 'Treasury Board of Canada Secretariat',
                    province: 'Ontario',
                    sector: 'TBS',
                    zone: 'FED',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key}, successfully updated org ${org._key}.`,
            ])
          })
        })
        describe('updating the province', () => {
          it('returns the updated organization', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    provinceEN: "A New Province"
                  }
                ) {
                  organization {
                    acronym
                    name
                    zone
                    sector
                    country
                    province
                    city
                  }
                }
              }
              `,
              null,
              {
                query,
                collections,
                transaction,
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
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const expectedResponse = {
              data: {
                updateOrganization: {
                  organization: {
                    acronym: 'TBS',
                    city: 'Ottawa',
                    country: 'Canada',
                    name: 'Treasury Board of Canada Secretariat',
                    province: 'A New Province',
                    sector: 'TBS',
                    zone: 'FED',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key}, successfully updated org ${org._key}.`,
            ])
          })
        })
        describe('updating the city', () => {
          it('returns the updated organization', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    cityEN: "A New City"
                  }
                ) {
                  organization {
                    acronym
                    name
                    zone
                    sector
                    country
                    province
                    city
                  }
                }
              }
              `,
              null,
              {
                query,
                collections,
                transaction,
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
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const expectedResponse = {
              data: {
                updateOrganization: {
                  organization: {
                    acronym: 'TBS',
                    city: 'A New City',
                    country: 'Canada',
                    name: 'Treasury Board of Canada Secretariat',
                    province: 'Ontario',
                    sector: 'TBS',
                    zone: 'FED',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key}, successfully updated org ${org._key}.`,
            ])
          })
        })
        describe('updating all organizational fields', () => {
          it('returns the updated organization', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    acronymEN: "NEW_ACRONYM"
                    nameEN: "New Name"
                    zoneEN: "New Zone"
                    sectorEN: "New Sector"
                    countryEN: "New Country"
                    provinceEN: "New Province"
                    cityEN: "New City"
                    acronymFR: "NOUVEL_ACRONYME"
                    nameFR: "Nouveau nom"
                    zoneFR: "Nouvelle zone"
                    sectorFR: "Nouveau secteur"
                    countryFR: "Nouveau pays"
                    provinceFR: "Nouvelle province"
                    cityFR: "Nouvelle ville"
                  }
                ) {
                  organization {
                    acronym
                    name
                    zone
                    sector
                    country
                    province
                    city
                  }
                }
              }
              `,
              null,
              {
                query,
                collections,
                transaction,
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
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const expectedResponse = {
              data: {
                updateOrganization: {
                  organization: {
                    acronym: 'NEW_ACRONYM',
                    name: 'New Name',
                    zone: 'New Zone',
                    sector: 'New Sector',
                    country: 'New Country',
                    province: 'New Province',
                    city: 'New City',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key}, successfully updated org ${org._key}.`,
            ])
          })
        })
      })
      describe('users language is french', () => {
        describe('updating the acronym', () => {
          it('returns the updated organization', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    acronymFR: "TEST"
                  }
                ) {
                  organization {
                    acronym
                    name
                    zone
                    sector
                    country
                    province
                    city
                  }
                }
              }
              `,
              null,
              {
                query,
                collections,
                transaction,
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
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const expectedResponse = {
              data: {
                updateOrganization: {
                  organization: {
                    acronym: 'TEST',
                    city: 'Ottawa',
                    country: 'Canada',
                    name: 'Secrétariat du Conseil Trésor du Canada',
                    province: 'Ontario',
                    sector: 'TBS',
                    zone: 'FED',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key}, successfully updated org ${org._key}.`,
            ])
          })
        })
        describe('updating the name', () => {
          it('returns the updated organization', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    nameFR: "Test"
                  }
                ) {
                  organization {
                    acronym
                    name
                    zone
                    sector
                    country
                    province
                    city
                  }
                }
              }
              `,
              null,
              {
                query,
                collections,
                transaction,
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
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const expectedResponse = {
              data: {
                updateOrganization: {
                  organization: {
                    acronym: 'SCT',
                    city: 'Ottawa',
                    country: 'Canada',
                    name: 'Test',
                    province: 'Ontario',
                    sector: 'TBS',
                    zone: 'FED',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key}, successfully updated org ${org._key}.`,
            ])
          })
        })
        describe('updating the zone', () => {
          it('returns the updated organization', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    zoneFR: "Secret Zone"
                  }
                ) {
                  organization {
                    acronym
                    name
                    zone
                    sector
                    country
                    province
                    city
                  }
                }
              }
              `,
              null,
              {
                query,
                collections,
                transaction,
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
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const expectedResponse = {
              data: {
                updateOrganization: {
                  organization: {
                    acronym: 'SCT',
                    name: 'Secrétariat du Conseil Trésor du Canada',
                    zone: 'Secret Zone',
                    sector: 'TBS',
                    country: 'Canada',
                    province: 'Ontario',
                    city: 'Ottawa',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key}, successfully updated org ${org._key}.`,
            ])
          })
        })
        describe('updating the sector', () => {
          it('returns the updated organization', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    sectorFR: "New Sector"
                  }
                ) {
                  organization {
                    acronym
                    name
                    zone
                    sector
                    country
                    province
                    city
                  }
                }
              }
              `,
              null,
              {
                query,
                collections,
                transaction,
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
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const expectedResponse = {
              data: {
                updateOrganization: {
                  organization: {
                    acronym: 'SCT',
                    name: 'Secrétariat du Conseil Trésor du Canada',
                    zone: 'FED',
                    sector: 'New Sector',
                    country: 'Canada',
                    province: 'Ontario',
                    city: 'Ottawa',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key}, successfully updated org ${org._key}.`,
            ])
          })
        })
        describe('updating the country', () => {
          it('returns the updated organization', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    countryFR: "A New Country"
                  }
                ) {
                  organization {
                    acronym
                    name
                    zone
                    sector
                    country
                    province
                    city
                  }
                }
              }
              `,
              null,
              {
                query,
                collections,
                transaction,
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
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const expectedResponse = {
              data: {
                updateOrganization: {
                  organization: {
                    acronym: 'SCT',
                    name: 'Secrétariat du Conseil Trésor du Canada',
                    zone: 'FED',
                    sector: 'TBS',
                    country: 'A New Country',
                    province: 'Ontario',
                    city: 'Ottawa',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key}, successfully updated org ${org._key}.`,
            ])
          })
        })
        describe('updating the province', () => {
          it('returns the updated organization', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    provinceFR: "A New Province"
                  }
                ) {
                  organization {
                    acronym
                    name
                    zone
                    sector
                    country
                    province
                    city
                  }
                }
              }
              `,
              null,
              {
                query,
                collections,
                transaction,
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
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const expectedResponse = {
              data: {
                updateOrganization: {
                  organization: {
                    acronym: 'SCT',
                    name: 'Secrétariat du Conseil Trésor du Canada',
                    zone: 'FED',
                    sector: 'TBS',
                    country: 'Canada',
                    province: 'A New Province',
                    city: 'Ottawa',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key}, successfully updated org ${org._key}.`,
            ])
          })
        })
        describe('updating the city', () => {
          it('returns the updated organization', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    cityFR: "A New City"
                  }
                ) {
                  organization {
                    acronym
                    name
                    zone
                    sector
                    country
                    province
                    city
                  }
                }
              }
              `,
              null,
              {
                query,
                collections,
                transaction,
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
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const expectedResponse = {
              data: {
                updateOrganization: {
                  organization: {
                    acronym: 'SCT',
                    city: 'A New City',
                    country: 'Canada',
                    name: 'Secrétariat du Conseil Trésor du Canada',
                    province: 'Ontario',
                    sector: 'TBS',
                    zone: 'FED',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key}, successfully updated org ${org._key}.`,
            ])
          })
        })
        describe('updating all organizational fields', () => {
          it('returns the updated organization', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    acronymEN: "NEW_ACRONYM"
                    nameEN: "New Name"
                    zoneEN: "New Zone"
                    sectorEN: "New Sector"
                    countryEN: "New Country"
                    provinceEN: "New Province"
                    cityEN: "New City"
                    acronymFR: "NOUVEL_ACRONYME"
                    nameFR: "Nouveau nom"
                    zoneFR: "Nouvelle zone"
                    sectorFR: "Nouveau secteur"
                    countryFR: "Nouveau pays"
                    provinceFR: "Nouvelle province"
                    cityFR: "Nouvelle ville"
                  }
                ) {
                  organization {
                    acronym
                    name
                    zone
                    sector
                    country
                    province
                    city
                  }
                }
              }
              `,
              null,
              {
                query,
                collections,
                transaction,
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
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const expectedResponse = {
              data: {
                updateOrganization: {
                  organization: {
                    acronym: 'NOUVEL_ACRONYME',
                    city: 'Nouvelle ville',
                    country: 'Nouveau pays',
                    name: 'Nouveau nom',
                    province: 'Nouvelle province',
                    sector: 'Nouveau secteur',
                    zone: 'Nouvelle zone',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key}, successfully updated org ${org._key}.`,
            ])
          })
        })
      })
    })
  })
  describe('given an unsuccessful organization update', () => {
    let i18n
    describe('users language is set to english', () => {
      beforeAll(() => {
        i18n = setupI18n({
          language: 'en',
          locales: ['en', 'fr'],
          missing: 'Traduction manquante',
          catalogs: {
            en: englishMessages,
            fr: frenchMessages,
          },
        })
      })
      describe('user is located in the database', () => {
        beforeEach(async () => {
          await collections.organizations.save({
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
        describe('user does not have the proper permissions', () => {
          let user, org
          beforeEach(async () => {
            const userCursor = await query`
                FOR user IN users
                  FILTER user.userName == "test.account@istio.actually.exists"
                  RETURN user
              `
            const orgCursor = await query`
                FOR org IN organizations
                  FILTER (LOWER("treasury-board-secretariat") == LOWER(TRANSLATE("en", org.orgDetails).slug))
                  RETURN MERGE({ _id: org._id, _key: org._key, _rev: org._rev }, TRANSLATE("en", org.orgDetails))
              `
            user = await userCursor.next()
            org = await orgCursor.next()
          })
          describe('user has user level permission', () => {
            beforeEach(async () => {
              await query`
                INSERT {
                  _from: ${org._id},
                  _to: ${user._id},
                  permission: "user"
                } INTO affiliations
              `
            })
            it('returns an error', async () => {
              const response = await graphql(
                schema,
                `
                mutation {
                  updateOrganization (
                    input: {
                      id: "${toGlobalId('organization', org._key)}"
                      cityEN: "A New City"
                    }
                  ) {
                    organization {
                      city
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
                  validators: {
                    cleanseInput,
                    slugify,
                  },
                  loaders: {
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                  },
                },
              )

              const error = [
                new GraphQLError(
                  'Unable to update organization. Please try again.',
                ),
              ]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `User: ${user._key} attempted to update organization ${org._key}, however they do not have the correct permission level. Permission: user`,
              ])
            })
          })
          describe('user does not belong to that organization', () => {
            it('returns an error message', async () => {
              const response = await graphql(
                schema,
                `
                mutation {
                  updateOrganization (
                    input: {
                      id: "${toGlobalId('organization', org._key)}"
                      cityEN: "A New City"
                    }
                  ) {
                    organization {
                      city
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
                  validators: {
                    cleanseInput,
                    slugify,
                  },
                  loaders: {
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                  },
                },
              )

              const error = [
                new GraphQLError(
                  'Unable to update organization. Please try again.',
                ),
              ]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `User: ${user._key} attempted to update organization ${org._key}, however they do not have the correct permission level. Permission: undefined`,
              ])
            })
          })
        })
      })
      describe('organization cannot be found', () => {
        describe('organization does not exist in database', () => {
          let user
          beforeEach(async () => {
            await collections.organizations.save({
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
                  FILTER user.userName == "test.account@istio.actually.exists"
                  RETURN user
              `
            user = await userCursor.next()
          })
          it('returns an error', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  updateOrganization(
                    input: { id: "${toGlobalId(
                      'organization',
                      1,
                    )}", cityEN: "A New City" }
                  ) {
                    organization {
                      city
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
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const error = [
              new GraphQLError(
                'Unable to update organization. Please try again.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to update organization: 1, however no organizations is associated with that id.`,
            ])
          })
        })
      })
      describe('database error occurs', () => {
        let user, org
        beforeEach(async () => {
          await collections.organizations.save({
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
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          const orgCursor = await query`
            FOR org IN organizations
              FILTER (LOWER("treasury-board-secretariat") == LOWER(TRANSLATE("en", org.orgDetails).slug))
              RETURN MERGE({ _id: org._id, _key: org._key, _rev: org._rev }, TRANSLATE("en", org.orgDetails))
          `
          user = await userCursor.next()
          org = await orgCursor.next()

          await query`
            INSERT {
              _from: ${org._id},
              _to: ${user._id},
              permission: "admin"
            } INTO affiliations
          `
        })
        describe('when gathering all the org details', () => {
          it('returns an error', async () => {
            const orgLoader = orgLoaderByKey(query, 'en')
            const userLoader = userLoaderByKey(query)

            const mockQuery = jest
              .fn()
              .mockReturnValueOnce({
                next() {
                  return 'super_admin'
                },
              })
              .mockRejectedValue(new Error('Database error occurred.'))

            const response = await graphql(
              schema,
              `
                mutation {
                  updateOrganization(
                    input: { id: "${toGlobalId(
                      'organization',
                      org._key,
                    )}", cityEN: "A New City" }
                  ) {
                    organization {
                      city
                    }
                  }
                }
              `,
              null,
              {
                i18n,
                query: mockQuery,
                collections,
                transaction,
                userKey: user._key,
                auth: {
                  checkPermission: checkPermission({
                    i18n,
                    userKey: user._key,
                    query: mockQuery,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    userLoaderByKey: userLoaderByKey(query),
                  }),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoader,
                  userLoaderByKey: userLoader,
                },
              },
            )

            const error = [
              new GraphQLError(
                'Unable to update organization. Please try again.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred while retrieving org: ${org._key} for update, err: Error: Database error occurred.`,
            ])
          })
        })
        describe('when updating/inserting new org details', () => {
          it('returns an error', async () => {
            const orgLoader = orgLoaderByKey(query, 'en')
            const userLoader = userLoaderByKey(query)

            const mockQuery = jest
              .fn()
              .mockReturnValueOnce({
                next() {
                  return 'super_admin'
                },
              })
              .mockReturnValueOnce({
                next() {
                  return {
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
                },
              })
              .mockRejectedValue(new Error('Database error occurred.'))

            const response = await graphql(
              schema,
              `
                mutation {
                  updateOrganization(
                    input: { id: "${toGlobalId(
                      'organization',
                      org._key,
                    )}", cityEN: "A New City" }
                  ) {
                    organization {
                      city
                    }
                  }
                }
              `,
              null,
              {
                i18n,
                query: mockQuery,
                collections,
                transaction,
                userKey: user._key,
                auth: {
                  checkPermission: checkPermission({
                    i18n,
                    userKey: user._key,
                    query: mockQuery,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    userLoaderByKey: userLoaderByKey(query),
                  }),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoader,
                  userLoaderByKey: userLoader,
                },
              },
            )

            const error = [
              new GraphQLError(
                'Unable to update organization. Please try again.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction error occurred while upserting org: ${org._key}, err: Error: Database error occurred.`,
            ])
          })
        })
        describe('when committing transaction', () => {
          it('returns an error', async () => {
            const orgLoader = orgLoaderByKey(query, 'en')
            const userLoader = userLoaderByKey(query)

            transaction = jest.fn().mockReturnValue({
              run() {
                return {
                  next() {
                    return {
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
                  },
                }
              },
              commit() {
                throw new Error('Database error occurred.')
              },
            })

            const response = await graphql(
              schema,
              `
                mutation {
                  updateOrganization(
                    input: { id: "${toGlobalId(
                      'organization',
                      org._key,
                    )}", cityEN: "A New City" }
                  ) {
                    organization {
                      city
                    }
                  }
                }
              `,
              null,
              {
                i18n,
                query: query,
                collections,
                transaction,
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
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoader,
                  userLoaderByKey: userLoader,
                },
              },
            )

            const error = [
              new GraphQLError(
                'Unable to update organization. Please try again.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction error occurred while committing org: ${org._key}, err: Error: Database error occurred.`,
            ])
          })
        })
      })
    })
    describe('users language is set to french', () => {
      beforeAll(() => {
        i18n = setupI18n({
          language: 'fr',
          locales: ['en', 'fr'],
          missing: 'Traduction manquante',
          catalogs: {
            en: englishMessages,
            fr: frenchMessages,
          },
        })
      })
      describe('user is located in the database', () => {
        beforeEach(async () => {
          await collections.organizations.save({
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
        describe('user does not have the proper permissions', () => {
          let user, org
          beforeEach(async () => {
            const userCursor = await query`
                FOR user IN users
                  FILTER user.userName == "test.account@istio.actually.exists"
                  RETURN user
              `
            const orgCursor = await query`
                FOR org IN organizations
                  FILTER (LOWER("treasury-board-secretariat") == LOWER(TRANSLATE("en", org.orgDetails).slug))
                  RETURN MERGE({ _id: org._id, _key: org._key, _rev: org._rev }, TRANSLATE("en", org.orgDetails))
              `
            user = await userCursor.next()
            org = await orgCursor.next()
          })
          describe('user has user level permission', () => {
            beforeEach(async () => {
              await query`
                INSERT {
                  _from: ${org._id},
                  _to: ${user._id},
                  permission: "user"
                } INTO affiliations
              `
            })
            it('returns an error', async () => {
              const response = await graphql(
                schema,
                `
                mutation {
                  updateOrganization (
                    input: {
                      id: "${toGlobalId('organization', org._key)}"
                      cityEN: "A New City"
                    }
                  ) {
                    organization {
                      city
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
                  validators: {
                    cleanseInput,
                    slugify,
                  },
                  loaders: {
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                  },
                },
              )

              const error = [new GraphQLError('todo')]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `User: ${user._key} attempted to update organization ${org._key}, however they do not have the correct permission level. Permission: user`,
              ])
            })
          })
          describe('user does not belong to that organization', () => {
            it('returns an error message', async () => {
              const response = await graphql(
                schema,
                `
                mutation {
                  updateOrganization (
                    input: {
                      id: "${toGlobalId('organization', org._key)}"
                      cityEN: "A New City"
                    }
                  ) {
                    organization {
                      city
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
                  validators: {
                    cleanseInput,
                    slugify,
                  },
                  loaders: {
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                  },
                },
              )

              const error = [new GraphQLError('todo')]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `User: ${user._key} attempted to update organization ${org._key}, however they do not have the correct permission level. Permission: undefined`,
              ])
            })
          })
        })
      })
      describe('organization cannot be found', () => {
        describe('organization does not exist in database', () => {
          let user
          beforeEach(async () => {
            await collections.organizations.save({
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
                  FILTER user.userName == "test.account@istio.actually.exists"
                  RETURN user
              `
            user = await userCursor.next()
          })
          it('returns an error', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  updateOrganization(
                    input: { id: "${toGlobalId(
                      'organization',
                      1,
                    )}", cityEN: "A New City" }
                  ) {
                    organization {
                      city
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
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const error = [new GraphQLError('todo')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to update organization: 1, however no organizations is associated with that id.`,
            ])
          })
        })
      })
      describe('database error occurs', () => {
        let user, org
        beforeEach(async () => {
          await collections.organizations.save({
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
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          const orgCursor = await query`
            FOR org IN organizations
              FILTER (LOWER("treasury-board-secretariat") == LOWER(TRANSLATE("en", org.orgDetails).slug))
              RETURN MERGE({ _id: org._id, _key: org._key, _rev: org._rev }, TRANSLATE("en", org.orgDetails))
          `
          user = await userCursor.next()
          org = await orgCursor.next()

          await query`
            INSERT {
              _from: ${org._id},
              _to: ${user._id},
              permission: "admin"
            } INTO affiliations
          `
        })
        describe('when gathering all the org details', () => {
          it('returns an error', async () => {
            const orgLoader = orgLoaderByKey(query, 'en')
            const userLoader = userLoaderByKey(query)

            const mockQuery = jest
              .fn()
              .mockReturnValueOnce({
                next() {
                  return 'super_admin'
                },
              })
              .mockRejectedValue(new Error('Database error occurred.'))

            const response = await graphql(
              schema,
              `
                mutation {
                  updateOrganization(
                    input: { id: "${toGlobalId(
                      'organization',
                      org._key,
                    )}", cityEN: "A New City" }
                  ) {
                    organization {
                      city
                    }
                  }
                }
              `,
              null,
              {
                i18n,
                query: mockQuery,
                collections,
                transaction,
                userKey: user._key,
                auth: {
                  checkPermission: checkPermission({
                    i18n,
                    userKey: user._key,
                    query: mockQuery,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    userLoaderByKey: userLoaderByKey(query),
                  }),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoader,
                  userLoaderByKey: userLoader,
                },
              },
            )

            const error = [new GraphQLError('todo')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred while retrieving org: ${org._key} for update, err: Error: Database error occurred.`,
            ])
          })
        })
        describe('when updating/inserting new org details', () => {
          it('returns an error', async () => {
            const orgLoader = orgLoaderByKey(query, 'en')
            const userLoader = userLoaderByKey(query)

            const mockQuery = jest
              .fn()
              .mockReturnValueOnce({
                next() {
                  return 'super_admin'
                },
              })
              .mockReturnValueOnce({
                next() {
                  return {
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
                },
              })
              .mockRejectedValue(new Error('Database error occurred.'))

            const response = await graphql(
              schema,
              `
                mutation {
                  updateOrganization(
                    input: { id: "${toGlobalId(
                      'organization',
                      org._key,
                    )}", cityEN: "A New City" }
                  ) {
                    organization {
                      city
                    }
                  }
                }
              `,
              null,
              {
                i18n,
                query: mockQuery,
                collections,
                transaction,
                userKey: user._key,
                auth: {
                  checkPermission: checkPermission({
                    i18n,
                    userKey: user._key,
                    query: mockQuery,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    userLoaderByKey: userLoaderByKey(query),
                  }),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoader,
                  userLoaderByKey: userLoader,
                },
              },
            )

            const error = [new GraphQLError('todo')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction error occurred while upserting org: ${org._key}, err: Error: Database error occurred.`,
            ])
          })
        })
        describe('when committing transaction', () => {
          it('returns an error', async () => {
            const orgLoader = orgLoaderByKey(query, 'en')
            const userLoader = userLoaderByKey(query)

            transaction = jest.fn().mockReturnValue({
              run() {
                return {
                  next() {
                    return {
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
                  },
                }
              },
              commit() {
                throw new Error('Database error occurred.')
              },
            })

            const response = await graphql(
              schema,
              `
                mutation {
                  updateOrganization(
                    input: { id: "${toGlobalId(
                      'organization',
                      org._key,
                    )}", cityEN: "A New City" }
                  ) {
                    organization {
                      city
                    }
                  }
                }
              `,
              null,
              {
                i18n,
                query: query,
                collections,
                transaction,
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
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  orgLoaderByKey: orgLoader,
                  userLoaderByKey: userLoader,
                },
              },
            )

            const error = [new GraphQLError('todo')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction error occurred while committing org: ${org._key}, err: Error: Database error occurred.`,
            ])
          })
        })
      })
    })
  })
})
