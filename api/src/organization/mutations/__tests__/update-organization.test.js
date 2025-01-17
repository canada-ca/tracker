import { setupI18n } from '@lingui/core'
import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { toGlobalId } from 'graphql-relay'

import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { cleanseInput, slugify } from '../../../validators'
import { checkPermission, userRequired, verifiedRequired } from '../../../auth'
import { loadUserByKey } from '../../../user/loaders'
import { loadOrgByKey } from '../../loaders'
import dbschema from '../../../../database.json'
import { collectionNames } from '../../../collection-names'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('updating an organization', () => {
  let query, drop, truncate, schema, collections, transaction, user

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
  })
  beforeEach(() => {
    consoleOutput.length = 0
  })

  describe('given a successful organization update', () => {
    let org
    beforeEach(async () => {
      // Generate DB Items
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
      user = await collections.users.save({
        userName: 'test.account@istio.actually.exists',
        emailValidated: true,
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
      await drop()
    })

    describe('users permission level is super_admin', () => {
      beforeEach(async () => {
        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'super_admin',
        })
      })
      describe('users language is english', () => {
        describe('updating the acronym', () => {
          it('returns the updated organization', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    acronymEN: "TEST"
                  }
                ) {
                  result {
                    ... on Organization {
                      acronym
                      name
                      zone
                      sector
                      country
                      province
                      city
                    }
                    ... on OrganizationError {
                      code
                      description
                    }
                  }
                }
              }
              `,
              rootValue: null,
              contextValue: {
                query,
                collections: collectionNames,
                transaction,
                userKey: user._key,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const expectedResponse = {
              data: {
                updateOrganization: {
                  result: {
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
            expect(consoleOutput).toEqual([`User: ${user._key}, successfully updated org ${org._key}.`])
          })
        })
        describe('updating the name', () => {
          it('returns the updated organization', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    nameEN: "Test"
                  }
                ) {
                  result {
                    ... on Organization {
                      acronym
                      name
                      zone
                      sector
                      country
                      province
                      city
                    }
                    ... on OrganizationError {
                      code
                      description
                    }
                  }
                }
              }
              `,
              rootValue: null,
              contextValue: {
                query,
                collections: collectionNames,
                transaction,
                userKey: user._key,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const expectedResponse = {
              data: {
                updateOrganization: {
                  result: {
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
            expect(consoleOutput).toEqual([`User: ${user._key}, successfully updated org ${org._key}.`])
          })
        })
        describe('updating the zone', () => {
          it('returns the updated organization', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    zoneEN: "New Zone"
                  }
                ) {
                  result {
                    ... on Organization {
                      acronym
                      name
                      zone
                      sector
                      country
                      province
                      city
                    }
                    ... on OrganizationError {
                      code
                      description
                    }
                  }
                }
              }
              `,
              rootValue: null,
              contextValue: {
                query,
                collections: collectionNames,
                transaction,
                userKey: user._key,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const expectedResponse = {
              data: {
                updateOrganization: {
                  result: {
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
            expect(consoleOutput).toEqual([`User: ${user._key}, successfully updated org ${org._key}.`])
          })
        })
        describe('updating the sector', () => {
          it('returns the updated organization', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    sectorEN: "New Sector"
                  }
                ) {
                  result {
                    ... on Organization {
                      acronym
                      name
                      zone
                      sector
                      country
                      province
                      city
                    }
                    ... on OrganizationError {
                      code
                      description
                    }
                  }
                }
              }
              `,
              rootValue: null,
              contextValue: {
                query,
                collections: collectionNames,
                transaction,
                userKey: user._key,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const expectedResponse = {
              data: {
                updateOrganization: {
                  result: {
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
            expect(consoleOutput).toEqual([`User: ${user._key}, successfully updated org ${org._key}.`])
          })
        })
        describe('updating the country', () => {
          it('returns the updated organization', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    countryEN: "A New Country"
                  }
                ) {
                  result {
                    ... on Organization {
                      acronym
                      name
                      zone
                      sector
                      country
                      province
                      city
                    }
                    ... on OrganizationError {
                      code
                      description
                    }
                  }
                }
              }
              `,
              rootValue: null,
              contextValue: {
                query,
                collections: collectionNames,
                transaction,
                userKey: user._key,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const expectedResponse = {
              data: {
                updateOrganization: {
                  result: {
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
            expect(consoleOutput).toEqual([`User: ${user._key}, successfully updated org ${org._key}.`])
          })
        })
        describe('updating the province', () => {
          it('returns the updated organization', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    provinceEN: "A New Province"
                  }
                ) {
                  result {
                    ... on Organization {
                      acronym
                      name
                      zone
                      sector
                      country
                      province
                      city
                    }
                    ... on OrganizationError {
                      code
                      description
                    }
                  }
                }
              }
              `,
              rootValue: null,
              contextValue: {
                query,
                collections: collectionNames,
                transaction,
                userKey: user._key,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const expectedResponse = {
              data: {
                updateOrganization: {
                  result: {
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
            expect(consoleOutput).toEqual([`User: ${user._key}, successfully updated org ${org._key}.`])
          })
        })
        describe('updating the city', () => {
          it('returns the updated organization', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    cityEN: "A New City"
                  }
                ) {
                  result {
                    ... on Organization {
                      acronym
                      name
                      zone
                      sector
                      country
                      province
                      city
                    }
                    ... on OrganizationError {
                      code
                      description
                    }
                  }
                }
              }
              `,
              rootValue: null,
              contextValue: {
                query,
                collections: collectionNames,
                transaction,
                userKey: user._key,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const expectedResponse = {
              data: {
                updateOrganization: {
                  result: {
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
            expect(consoleOutput).toEqual([`User: ${user._key}, successfully updated org ${org._key}.`])
          })
        })
        describe('updating all organizational fields', () => {
          it('returns the updated organization', async () => {
            const response = await graphql({
              schema,
              source: `
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
                  result {
                    ... on Organization {
                      acronym
                      name
                      zone
                      sector
                      country
                      province
                      city
                    }
                    ... on OrganizationError {
                      code
                      description
                    }
                  }
                }
              }
              `,
              rootValue: null,
              contextValue: {
                query,
                collections: collectionNames,
                transaction,
                userKey: user._key,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const expectedResponse = {
              data: {
                updateOrganization: {
                  result: {
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
            expect(consoleOutput).toEqual([`User: ${user._key}, successfully updated org ${org._key}.`])
          })
        })
      })
      describe('users language is french', () => {
        describe('updating the acronym', () => {
          it('returns the updated organization', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    acronymFR: "TEST"
                  }
                ) {
                  result {
                    ... on Organization {
                      acronym
                      name
                      zone
                      sector
                      country
                      province
                      city
                    }
                    ... on OrganizationError {
                      code
                      description
                    }
                  }
                }
              }
              `,
              rootValue: null,
              contextValue: {
                query,
                collections: collectionNames,
                transaction,
                userKey: user._key,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'fr' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const expectedResponse = {
              data: {
                updateOrganization: {
                  result: {
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
            expect(consoleOutput).toEqual([`User: ${user._key}, successfully updated org ${org._key}.`])
          })
        })
        describe('updating the name', () => {
          it('returns the updated organization', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    nameFR: "Test"
                  }
                ) {
                  result {
                    ... on Organization {
                      acronym
                      name
                      zone
                      sector
                      country
                      province
                      city
                    }
                    ... on OrganizationError {
                      code
                      description
                    }
                  }
                }
              }
              `,
              rootValue: null,
              contextValue: {
                query,
                collections: collectionNames,
                transaction,
                userKey: user._key,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'fr' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const expectedResponse = {
              data: {
                updateOrganization: {
                  result: {
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
            expect(consoleOutput).toEqual([`User: ${user._key}, successfully updated org ${org._key}.`])
          })
        })
        describe('updating the zone', () => {
          it('returns the updated organization', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    zoneFR: "Secret Zone"
                  }
                ) {
                  result {
                    ... on Organization {
                      acronym
                      name
                      zone
                      sector
                      country
                      province
                      city
                    }
                    ... on OrganizationError {
                      code
                      description
                    }
                  }
                }
              }
              `,
              rootValue: null,
              contextValue: {
                query,
                collections: collectionNames,
                transaction,
                userKey: user._key,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'fr' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const expectedResponse = {
              data: {
                updateOrganization: {
                  result: {
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
            expect(consoleOutput).toEqual([`User: ${user._key}, successfully updated org ${org._key}.`])
          })
        })
        describe('updating the sector', () => {
          it('returns the updated organization', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    sectorFR: "New Sector"
                  }
                ) {
                  result {
                    ... on Organization {
                      acronym
                      name
                      zone
                      sector
                      country
                      province
                      city
                    }
                    ... on OrganizationError {
                      code
                      description
                    }
                  }
                }
              }
              `,
              rootValue: null,
              contextValue: {
                query,
                collections: collectionNames,
                transaction,
                userKey: user._key,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'fr' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const expectedResponse = {
              data: {
                updateOrganization: {
                  result: {
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
            expect(consoleOutput).toEqual([`User: ${user._key}, successfully updated org ${org._key}.`])
          })
        })
        describe('updating the country', () => {
          it('returns the updated organization', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    countryFR: "A New Country"
                  }
                ) {
                  result {
                    ... on Organization {
                      acronym
                      name
                      zone
                      sector
                      country
                      province
                      city
                    }
                    ... on OrganizationError {
                      code
                      description
                    }
                  }
                }
              }
              `,
              rootValue: null,
              contextValue: {
                query,
                collections: collectionNames,
                transaction,
                userKey: user._key,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'fr' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const expectedResponse = {
              data: {
                updateOrganization: {
                  result: {
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
            expect(consoleOutput).toEqual([`User: ${user._key}, successfully updated org ${org._key}.`])
          })
        })
        describe('updating the province', () => {
          it('returns the updated organization', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    provinceFR: "A New Province"
                  }
                ) {
                  result {
                    ... on Organization {
                      acronym
                      name
                      zone
                      sector
                      country
                      province
                      city
                    }
                    ... on OrganizationError {
                      code
                      description
                    }
                  }
                }
              }
              `,
              rootValue: null,
              contextValue: {
                query,
                collections: collectionNames,
                transaction,
                userKey: user._key,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'fr' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const expectedResponse = {
              data: {
                updateOrganization: {
                  result: {
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
            expect(consoleOutput).toEqual([`User: ${user._key}, successfully updated org ${org._key}.`])
          })
        })
        describe('updating the city', () => {
          it('returns the updated organization', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    cityFR: "A New City"
                  }
                ) {
                  result {
                    ... on Organization {
                      acronym
                      name
                      zone
                      sector
                      country
                      province
                      city
                    }
                    ... on OrganizationError {
                      code
                      description
                    }
                  }
                }
              }
              `,
              rootValue: null,
              contextValue: {
                query,
                collections: collectionNames,
                transaction,
                userKey: user._key,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'fr' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const expectedResponse = {
              data: {
                updateOrganization: {
                  result: {
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
            expect(consoleOutput).toEqual([`User: ${user._key}, successfully updated org ${org._key}.`])
          })
        })
        describe('updating all organizational fields', () => {
          it('returns the updated organization', async () => {
            const response = await graphql({
              schema,
              source: `
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
                  result {
                    ... on Organization {
                      acronym
                      name
                      zone
                      sector
                      country
                      province
                      city
                    }
                    ... on OrganizationError {
                      code
                      description
                    }
                  }
                }
              }
              `,
              rootValue: null,
              contextValue: {
                query,
                collections: collectionNames,
                transaction,
                userKey: user._key,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'fr' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const expectedResponse = {
              data: {
                updateOrganization: {
                  result: {
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
            expect(consoleOutput).toEqual([`User: ${user._key}, successfully updated org ${org._key}.`])
          })
        })
      })
    })
    describe('users permission level is admin', () => {
      beforeEach(async () => {
        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'admin',
        })
      })
      describe('users language is english', () => {
        describe('updating the acronym', () => {
          it('returns the updated organization', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    acronymEN: "TEST"
                  }
                ) {
                  result {
                    ... on Organization {
                      acronym
                      name
                      zone
                      sector
                      country
                      province
                      city
                    }
                    ... on OrganizationError {
                      code
                      description
                    }
                  }
                }
              }
              `,
              rootValue: null,
              contextValue: {
                query,
                collections: collectionNames,
                transaction,
                userKey: user._key,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const expectedResponse = {
              data: {
                updateOrganization: {
                  result: {
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
            expect(consoleOutput).toEqual([`User: ${user._key}, successfully updated org ${org._key}.`])
          })
        })
        describe('updating the name', () => {
          it('returns the updated organization', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    nameEN: "Test"
                  }
                ) {
                  result {
                    ... on Organization {
                      acronym
                      name
                      zone
                      sector
                      country
                      province
                      city
                    }
                    ... on OrganizationError {
                      code
                      description
                    }
                  }
                }
              }
              `,
              rootValue: null,
              contextValue: {
                query,
                collections: collectionNames,
                transaction,
                userKey: user._key,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const expectedResponse = {
              data: {
                updateOrganization: {
                  result: {
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
            expect(consoleOutput).toEqual([`User: ${user._key}, successfully updated org ${org._key}.`])
          })
        })
        describe('updating the zone', () => {
          it('returns the updated organization', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    zoneEN: "New Zone"
                  }
                ) {
                  result {
                    ... on Organization {
                      acronym
                      name
                      zone
                      sector
                      country
                      province
                      city
                    }
                    ... on OrganizationError {
                      code
                      description
                    }
                  }
                }
              }
              `,
              rootValue: null,
              contextValue: {
                query,
                collections: collectionNames,
                transaction,
                userKey: user._key,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const expectedResponse = {
              data: {
                updateOrganization: {
                  result: {
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
            expect(consoleOutput).toEqual([`User: ${user._key}, successfully updated org ${org._key}.`])
          })
        })
        describe('updating the sector', () => {
          it('returns the updated organization', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    sectorEN: "New Sector"
                  }
                ) {
                  result {
                    ... on Organization {
                      acronym
                      name
                      zone
                      sector
                      country
                      province
                      city
                    }
                    ... on OrganizationError {
                      code
                      description
                    }
                  }
                }
              }
              `,
              rootValue: null,
              contextValue: {
                query,
                collections: collectionNames,
                transaction,
                userKey: user._key,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const expectedResponse = {
              data: {
                updateOrganization: {
                  result: {
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
            expect(consoleOutput).toEqual([`User: ${user._key}, successfully updated org ${org._key}.`])
          })
        })
        describe('updating the country', () => {
          it('returns the updated organization', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    countryEN: "A New Country"
                  }
                ) {
                  result {
                    ... on Organization {
                      acronym
                      name
                      zone
                      sector
                      country
                      province
                      city
                    }
                    ... on OrganizationError {
                      code
                      description
                    }
                  }
                }
              }
              `,
              rootValue: null,
              contextValue: {
                query,
                collections: collectionNames,
                transaction,
                userKey: user._key,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const expectedResponse = {
              data: {
                updateOrganization: {
                  result: {
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
            expect(consoleOutput).toEqual([`User: ${user._key}, successfully updated org ${org._key}.`])
          })
        })
        describe('updating the province', () => {
          it('returns the updated organization', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    provinceEN: "A New Province"
                  }
                ) {
                  result {
                    ... on Organization {
                      acronym
                      name
                      zone
                      sector
                      country
                      province
                      city
                    }
                    ... on OrganizationError {
                      code
                      description
                    }
                  }
                }
              }
              `,
              rootValue: null,
              contextValue: {
                query,
                collections: collectionNames,
                transaction,
                userKey: user._key,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const expectedResponse = {
              data: {
                updateOrganization: {
                  result: {
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
            expect(consoleOutput).toEqual([`User: ${user._key}, successfully updated org ${org._key}.`])
          })
        })
        describe('updating the city', () => {
          it('returns the updated organization', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    cityEN: "A New City"
                  }
                ) {
                  result {
                    ... on Organization {
                      acronym
                      name
                      zone
                      sector
                      country
                      province
                      city
                    }
                    ... on OrganizationError {
                      code
                      description
                    }
                  }
                }
              }
              `,
              rootValue: null,
              contextValue: {
                query,
                collections: collectionNames,
                transaction,
                userKey: user._key,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const expectedResponse = {
              data: {
                updateOrganization: {
                  result: {
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
            expect(consoleOutput).toEqual([`User: ${user._key}, successfully updated org ${org._key}.`])
          })
        })
        describe('updating all organizational fields', () => {
          it('returns the updated organization', async () => {
            const response = await graphql({
              schema,
              source: `
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
                  result {
                    ... on Organization {
                      acronym
                      name
                      zone
                      sector
                      country
                      province
                      city
                    }
                    ... on OrganizationError {
                      code
                      description
                    }
                  }
                }
              }
              `,
              rootValue: null,
              contextValue: {
                query,
                collections: collectionNames,
                transaction,
                userKey: user._key,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const expectedResponse = {
              data: {
                updateOrganization: {
                  result: {
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
            expect(consoleOutput).toEqual([`User: ${user._key}, successfully updated org ${org._key}.`])
          })
        })
      })
      describe('users language is french', () => {
        describe('updating the acronym', () => {
          it('returns the updated organization', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    acronymFR: "TEST"
                  }
                ) {
                  result {
                    ... on Organization {
                      acronym
                      name
                      zone
                      sector
                      country
                      province
                      city
                    }
                    ... on OrganizationError {
                      code
                      description
                    }
                  }
                }
              }
              `,
              rootValue: null,
              contextValue: {
                query,
                collections: collectionNames,
                transaction,
                userKey: user._key,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'fr' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const expectedResponse = {
              data: {
                updateOrganization: {
                  result: {
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
            expect(consoleOutput).toEqual([`User: ${user._key}, successfully updated org ${org._key}.`])
          })
        })
        describe('updating the name', () => {
          it('returns the updated organization', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    nameFR: "Test"
                  }
                ) {
                  result {
                    ... on Organization {
                      acronym
                      name
                      zone
                      sector
                      country
                      province
                      city
                    }
                    ... on OrganizationError {
                      code
                      description
                    }
                  }
                }
              }
              `,
              rootValue: null,
              contextValue: {
                query,
                collections: collectionNames,
                transaction,
                userKey: user._key,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'fr' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const expectedResponse = {
              data: {
                updateOrganization: {
                  result: {
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
            expect(consoleOutput).toEqual([`User: ${user._key}, successfully updated org ${org._key}.`])
          })
        })
        describe('updating the zone', () => {
          it('returns the updated organization', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    zoneFR: "Secret Zone"
                  }
                ) {
                  result {
                    ... on Organization {
                      acronym
                      name
                      zone
                      sector
                      country
                      province
                      city
                    }
                    ... on OrganizationError {
                      code
                      description
                    }
                  }
                }
              }
              `,
              rootValue: null,
              contextValue: {
                query,
                collections: collectionNames,
                transaction,
                userKey: user._key,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'fr' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const expectedResponse = {
              data: {
                updateOrganization: {
                  result: {
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
            expect(consoleOutput).toEqual([`User: ${user._key}, successfully updated org ${org._key}.`])
          })
        })
        describe('updating the sector', () => {
          it('returns the updated organization', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    sectorFR: "New Sector"
                  }
                ) {
                  result {
                    ... on Organization {
                      acronym
                      name
                      zone
                      sector
                      country
                      province
                      city
                    }
                    ... on OrganizationError {
                      code
                      description
                    }
                  }
                }
              }
              `,
              rootValue: null,
              contextValue: {
                query,
                collections: collectionNames,
                transaction,
                userKey: user._key,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'fr' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const expectedResponse = {
              data: {
                updateOrganization: {
                  result: {
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
            expect(consoleOutput).toEqual([`User: ${user._key}, successfully updated org ${org._key}.`])
          })
        })
        describe('updating the country', () => {
          it('returns the updated organization', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    countryFR: "A New Country"
                  }
                ) {
                  result {
                    ... on Organization {
                      acronym
                      name
                      zone
                      sector
                      country
                      province
                      city
                    }
                    ... on OrganizationError {
                      code
                      description
                    }
                  }
                }
              }
              `,
              rootValue: null,
              contextValue: {
                query,
                collections: collectionNames,
                transaction,
                userKey: user._key,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'fr' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const expectedResponse = {
              data: {
                updateOrganization: {
                  result: {
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
            expect(consoleOutput).toEqual([`User: ${user._key}, successfully updated org ${org._key}.`])
          })
        })
        describe('updating the province', () => {
          it('returns the updated organization', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    provinceFR: "A New Province"
                  }
                ) {
                  result {
                    ... on Organization {
                      acronym
                      name
                      zone
                      sector
                      country
                      province
                      city
                    }
                    ... on OrganizationError {
                      code
                      description
                    }
                  }
                }
              }
              `,
              rootValue: null,
              contextValue: {
                query,
                collections: collectionNames,
                transaction,
                userKey: user._key,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'fr' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const expectedResponse = {
              data: {
                updateOrganization: {
                  result: {
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
            expect(consoleOutput).toEqual([`User: ${user._key}, successfully updated org ${org._key}.`])
          })
        })
        describe('updating the city', () => {
          it('returns the updated organization', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateOrganization (
                  input: {
                    id: "${toGlobalId('organization', org._key)}"
                    cityFR: "A New City"
                  }
                ) {
                  result {
                    ... on Organization {
                      acronym
                      name
                      zone
                      sector
                      country
                      province
                      city
                    }
                    ... on OrganizationError {
                      code
                      description
                    }
                  }
                }
              }
              `,
              rootValue: null,
              contextValue: {
                query,
                collections: collectionNames,
                transaction,
                userKey: user._key,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'fr' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const expectedResponse = {
              data: {
                updateOrganization: {
                  result: {
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
            expect(consoleOutput).toEqual([`User: ${user._key}, successfully updated org ${org._key}.`])
          })
        })
        describe('updating all organizational fields', () => {
          it('returns the updated organization', async () => {
            const response = await graphql({
              schema,
              source: `
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
                  result {
                    ... on Organization {
                      acronym
                      name
                      zone
                      sector
                      country
                      province
                      city
                    }
                    ... on OrganizationError {
                      code
                      description
                    }
                  }
                }
              }
              `,
              rootValue: null,
              contextValue: {
                query,
                collections: collectionNames,
                transaction,
                userKey: user._key,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'fr' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const expectedResponse = {
              data: {
                updateOrganization: {
                  result: {
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
            expect(consoleOutput).toEqual([`User: ${user._key}, successfully updated org ${org._key}.`])
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
      describe('organization cannot be found', () => {
        describe('organization does not exist in database', () => {
          it('returns an error', async () => {
            const response = await graphql({
              schema,
              source: `
                mutation {
                  updateOrganization(
                    input: { id: "${toGlobalId('organization', 1)}", cityEN: "A New City" }
                  ) {
                    result {
                      ... on Organization {
                        acronym
                        name
                        zone
                        sector
                        country
                        province
                        city
                      }
                      ... on OrganizationError {
                        code
                        description
                      }
                    }
                  }
                }
              `,
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction,
                userKey: 123,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn().mockReturnValue({ _key: 123 }),
                  verifiedRequired: jest.fn(),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue(undefined),
                  },
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
              },
            })

            const error = {
              data: {
                updateOrganization: {
                  result: {
                    code: 400,
                    description: 'Unable to update unknown organization.',
                  },
                },
              },
            }

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: 123 attempted to update organization: 1, however no organizations is associated with that id.`,
            ])
          })
        })
      })
      describe('user is located in the database', () => {
        describe('user does not have the proper permissions', () => {
          describe('user has user level permission', () => {
            it('returns an error', async () => {
              const response = await graphql({
                schema,
                source: `
                mutation {
                  updateOrganization (
                    input: {
                      id: "${toGlobalId('organization', 123)}"
                      cityEN: "A New City"
                    }
                  ) {
                    result {
                      ... on Organization {
                        acronym
                        name
                        zone
                        sector
                        country
                        province
                        city
                      }
                      ... on OrganizationError {
                        code
                        description
                      }
                    }
                  }
                }
                `,
                rootValue: null,
                contextValue: {
                  i18n,
                  query,
                  collections: collectionNames,
                  transaction,
                  userKey: 123,
                  request: { ip: '127.0.0.1' },
                  auth: {
                    checkPermission: jest.fn().mockReturnValue('user'),
                    userRequired: jest.fn().mockReturnValue({ _key: 123 }),
                    verifiedRequired: jest.fn(),
                  },
                  validators: {
                    cleanseInput,
                    slugify,
                  },
                  loaders: {
                    loadOrgByKey: {
                      load: jest.fn().mockReturnValue({ _id: 'organizations/123' }),
                    },
                    loadUserByKey: {
                      load: jest.fn(),
                    },
                  },
                },
              })

              const error = {
                data: {
                  updateOrganization: {
                    result: {
                      code: 403,
                      description:
                        'Permission Denied: Please contact organization admin for help with updating organization.',
                    },
                  },
                },
              }

              expect(response).toEqual(error)
              expect(consoleOutput).toEqual([
                `User: 123 attempted to update organization 123, however they do not have the correct permission level. Permission: user`,
              ])
            })
          })
          describe('user does not belong to that organization', () => {
            it('returns an error message', async () => {
              const response = await graphql({
                schema,
                source: `
                mutation {
                  updateOrganization (
                    input: {
                      id: "${toGlobalId('organization', 123)}"
                      cityEN: "A New City"
                    }
                  ) {
                    result {
                      ... on Organization {
                        acronym
                        name
                        zone
                        sector
                        country
                        province
                        city
                      }
                      ... on OrganizationError {
                        code
                        description
                      }
                    }
                  }
                }
                `,
                rootValue: null,
                contextValue: {
                  i18n,
                  query,
                  collections: collectionNames,
                  transaction,
                  userKey: 123,
                  request: { ip: '127.0.0.1' },
                  auth: {
                    checkPermission: jest.fn().mockReturnValue(undefined),
                    userRequired: jest.fn().mockReturnValue({ _key: 123 }),
                    verifiedRequired: jest.fn(),
                  },
                  validators: {
                    cleanseInput,
                    slugify,
                  },
                  loaders: {
                    loadOrgByKey: {
                      load: jest.fn().mockReturnValue({ _id: 'organizations/123' }),
                    },
                    loadUserByKey: {
                      load: jest.fn(),
                    },
                  },
                },
              })

              const error = {
                data: {
                  updateOrganization: {
                    result: {
                      code: 403,
                      description:
                        'Permission Denied: Please contact organization admin for help with updating organization.',
                    },
                  },
                },
              }

              expect(response).toEqual(error)
              expect(consoleOutput).toEqual([
                `User: 123 attempted to update organization 123, however they do not have the correct permission level. Permission: undefined`,
              ])
            })
          })
        })
      })
      describe('organization name is already in use', () => {
        it('returns an error', async () => {
          const response = await graphql({
            schema,
            source: `
              mutation {
                updateOrganization(
                  input: {
                    id: "${toGlobalId('organization', 123)}",
                    nameEN: "Treasury Board of Canada Secretariat"
                  }
                ) {
                  result {
                    ... on Organization {
                      acronym
                      name
                      zone
                      sector
                      country
                      province
                      city
                    }
                    ... on OrganizationError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            rootValue: null,
            contextValue: {
              i18n,
              query: jest.fn().mockReturnValue({ count: 1 }),
              collections: collectionNames,
              transaction,
              userKey: 123,
              request: { ip: '127.0.0.1' },
              auth: {
                checkPermission: jest.fn().mockReturnValue('admin'),
                userRequired: jest.fn().mockReturnValue({ _key: 123 }),
                verifiedRequired: jest.fn(),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({
                    name: 'Treasury Board of Canada Secretariat',
                    _key: 123,
                  }),
                },
                loadUserByKey: {
                  load: jest.fn(),
                },
              },
            },
          })

          const error = {
            data: {
              updateOrganization: {
                result: {
                  code: 400,
                  description: 'Organization name already in use, please choose another and try again.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to change the name of org: 123 however it is already in use.`,
          ])
        })
      })
      describe('cursor error occurs', () => {
        describe('when gathering comparison org details', () => {
          it('returns an error', async () => {
            const response = await graphql({
              schema,
              source: `
                mutation {
                  updateOrganization(
                    input: {
                      id: "${toGlobalId('organization', 123)}",
                      cityEN: "A New City"
                    }
                  ) {
                    result {
                      ... on Organization {
                        acronym
                        name
                        zone
                        sector
                        country
                        province
                        city
                      }
                      ... on OrganizationError {
                        code
                        description
                      }
                    }
                  }
                }
              `,
              rootValue: null,
              contextValue: {
                i18n,
                query: jest.fn().mockReturnValue({
                  next() {
                    throw new Error('Database error occurred.')
                  },
                }),
                collections: collectionNames,
                transaction,
                userKey: 123,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn().mockReturnValue({ _key: 123 }),
                  verifiedRequired: jest.fn(),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      name: 'Treasury Board of Canada Secretariat',
                      _key: 123,
                    }),
                  },
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
              },
            })

            const error = [new GraphQLError('Unable to update organization. Please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Cursor error occurred while retrieving org: 123 for update, err: Error: Database error occurred.`,
            ])
          })
        })
      })
      describe('database error occurs', () => {
        describe('when gathering comparison org details', () => {
          it('returns an error', async () => {
            const response = await graphql({
              schema,
              source: `
                mutation {
                  updateOrganization(
                    input: {
                      id: "${toGlobalId('organization', 123)}",
                      cityEN: "A New City"
                    }
                  ) {
                    result {
                      ... on Organization {
                        acronym
                        name
                        zone
                        sector
                        country
                        province
                        city
                      }
                      ... on OrganizationError {
                        code
                        description
                      }
                    }
                  }
                }
              `,
              rootValue: null,
              contextValue: {
                i18n,
                query: jest.fn().mockRejectedValue(new Error('Database error occurred.')),
                collections: collectionNames,
                transaction,
                userKey: 123,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn().mockReturnValue({ _key: 123 }),
                  verifiedRequired: jest.fn(),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      name: 'Treasury Board of Canada Secretariat',
                      _key: 123,
                    }),
                  },
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
              },
            })

            const error = [new GraphQLError('Unable to update organization. Please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred while retrieving org: 123 for update, err: Error: Database error occurred.`,
            ])
          })
        })
        describe('when checking to see if orgName is already in use', () => {
          it('throws an error', async () => {
            const response = await graphql({
              schema,
              source: `
                mutation {
                  updateOrganization(
                    input: {
                      id: "${toGlobalId('organization', 123)}",
                      nameEN: "Treasury Board of Canada Secretariat"
                    }
                  ) {
                    result {
                      ... on Organization {
                        acronym
                        name
                        zone
                        sector
                        country
                        province
                        city
                      }
                      ... on OrganizationError {
                        code
                        description
                      }
                    }
                  }
                }
              `,
              rootValue: null,
              contextValue: {
                i18n,
                query: jest.fn().mockRejectedValue(new Error('Database error occurred.')),
                collections: collectionNames,
                transaction,
                userKey: 123,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn().mockReturnValue({ _key: 123 }),
                  verifiedRequired: jest.fn(),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      name: 'Treasury Board of Canada Secretariat',
                      _key: 123,
                    }),
                  },
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
              },
            })

            const error = [new GraphQLError('Unable to update organization. Please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred during name check when user: 123 attempted to update org: 123, Error: Database error occurred.`,
            ])
          })
        })
      })
      describe('transaction error occurs', () => {
        describe('when updating/inserting new org details', () => {
          it('returns an error', async () => {
            const response = await graphql({
              schema,
              source: `
                mutation {
                  updateOrganization(
                    input: {
                      id: "${toGlobalId('organization', 123)}",
                      cityEN: "A New City"
                    }
                  ) {
                    result {
                      ... on Organization {
                        acronym
                        name
                        zone
                        sector
                        country
                        province
                        city
                      }
                      ... on OrganizationError {
                        code
                        description
                      }
                    }
                  }
                }
              `,
              rootValue: null,
              contextValue: {
                i18n,
                query: jest.fn().mockReturnValue({
                  next: jest.fn().mockReturnValue({
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
                  }),
                }),
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockRejectedValue(new Error('trx step error')),
                  abort: jest.fn(),
                }),
                userKey: 123,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn().mockReturnValue({ _key: 123 }),
                  verifiedRequired: jest.fn(),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      name: 'Treasury Board of Canada Secretariat',
                      _key: 123,
                    }),
                  },
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
              },
            })

            const error = [new GraphQLError('Unable to update organization. Please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction error occurred while upserting org: 123, err: Error: trx step error`,
            ])
          })
        })
        describe('when committing transaction', () => {
          it('returns an error', async () => {
            const response = await graphql({
              schema,
              source: `
                mutation {
                  updateOrganization(
                    input: {
                      id: "${toGlobalId('organization', 123)}",
                      cityEN: "A New City"
                    }
                  ) {
                    result {
                      ... on Organization {
                        acronym
                        name
                        zone
                        sector
                        country
                        province
                        city
                      }
                      ... on OrganizationError {
                        code
                        description
                      }
                    }
                  }
                }
              `,
              rootValue: null,
              contextValue: {
                i18n,
                query: jest.fn().mockReturnValue({
                  next: jest.fn().mockReturnValue({
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
                  }),
                }),
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn(),
                  commit: jest.fn().mockRejectedValue(new Error('trx commit error')),
                  abort: jest.fn(),
                }),
                userKey: 123,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn().mockReturnValue({ _key: 123 }),
                  verifiedRequired: jest.fn(),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      name: 'Treasury Board of Canada Secretariat',
                      _key: 123,
                    }),
                  },
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
              },
            })

            const error = [new GraphQLError('Unable to update organization. Please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction error occurred while committing org: 123, err: Error: trx commit error`,
            ])
          })
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
      describe('organization cannot be found', () => {
        describe('organization does not exist in database', () => {
          it('returns an error', async () => {
            const response = await graphql({
              schema,
              source: `
                mutation {
                  updateOrganization(
                    input: { id: "${toGlobalId('organization', 1)}", cityEN: "A New City" }
                  ) {
                    result {
                      ... on Organization {
                        acronym
                        name
                        zone
                        sector
                        country
                        province
                        city
                      }
                      ... on OrganizationError {
                        code
                        description
                      }
                    }
                  }
                }
              `,
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction,
                userKey: 123,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn().mockReturnValue({ _key: 123 }),
                  verifiedRequired: jest.fn(),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue(undefined),
                  },
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
              },
            })

            const error = {
              data: {
                updateOrganization: {
                  result: {
                    code: 400,
                    description: 'Impossible de mettre à jour une organisation inconnue.',
                  },
                },
              },
            }

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: 123 attempted to update organization: 1, however no organizations is associated with that id.`,
            ])
          })
        })
      })
      describe('user is located in the database', () => {
        describe('user does not have the proper permissions', () => {
          describe('user has user level permission', () => {
            it('returns an error', async () => {
              const response = await graphql({
                schema,
                source: `
                mutation {
                  updateOrganization (
                    input: {
                      id: "${toGlobalId('organization', 123)}"
                      cityEN: "A New City"
                    }
                  ) {
                    result {
                      ... on Organization {
                        acronym
                        name
                        zone
                        sector
                        country
                        province
                        city
                      }
                      ... on OrganizationError {
                        code
                        description
                      }
                    }
                  }
                }
                `,
                rootValue: null,
                contextValue: {
                  i18n,
                  query,
                  collections: collectionNames,
                  transaction,
                  userKey: 123,
                  request: { ip: '127.0.0.1' },
                  auth: {
                    checkPermission: jest.fn().mockReturnValue('user'),
                    userRequired: jest.fn().mockReturnValue({ _key: 123 }),
                    verifiedRequired: jest.fn(),
                  },
                  validators: {
                    cleanseInput,
                    slugify,
                  },
                  loaders: {
                    loadOrgByKey: {
                      load: jest.fn().mockReturnValue({ _id: 'organizations/123' }),
                    },
                    loadUserByKey: {
                      load: jest.fn(),
                    },
                  },
                },
              })

              const error = {
                data: {
                  updateOrganization: {
                    result: {
                      code: 403,
                      description:
                        "Permission refusée : Veuillez contacter l'administrateur de l'organisation pour obtenir de l'aide sur la suppression des utilisateurs.",
                    },
                  },
                },
              }

              expect(response).toEqual(error)
              expect(consoleOutput).toEqual([
                `User: 123 attempted to update organization 123, however they do not have the correct permission level. Permission: user`,
              ])
            })
          })
          describe('user does not belong to that organization', () => {
            it('returns an error message', async () => {
              const response = await graphql({
                schema,
                source: `
                mutation {
                  updateOrganization (
                    input: {
                      id: "${toGlobalId('organization', 123)}"
                      cityEN: "A New City"
                    }
                  ) {
                    result {
                      ... on Organization {
                        acronym
                        name
                        zone
                        sector
                        country
                        province
                        city
                      }
                      ... on OrganizationError {
                        code
                        description
                      }
                    }
                  }
                }
                `,
                rootValue: null,
                contextValue: {
                  i18n,
                  query,
                  collections: collectionNames,
                  transaction,
                  userKey: 123,
                  request: { ip: '127.0.0.1' },
                  auth: {
                    checkPermission: jest.fn().mockReturnValue(undefined),
                    userRequired: jest.fn().mockReturnValue({ _key: 123 }),
                    verifiedRequired: jest.fn(),
                  },
                  validators: {
                    cleanseInput,
                    slugify,
                  },
                  loaders: {
                    loadOrgByKey: {
                      load: jest.fn().mockReturnValue({ _id: 'organizations/123' }),
                    },
                    loadUserByKey: {
                      load: jest.fn(),
                    },
                  },
                },
              })

              const error = {
                data: {
                  updateOrganization: {
                    result: {
                      code: 403,
                      description:
                        "Permission refusée : Veuillez contacter l'administrateur de l'organisation pour obtenir de l'aide sur la suppression des utilisateurs.",
                    },
                  },
                },
              }

              expect(response).toEqual(error)
              expect(consoleOutput).toEqual([
                `User: 123 attempted to update organization 123, however they do not have the correct permission level. Permission: undefined`,
              ])
            })
          })
        })
      })
      describe('organization name is already in use', () => {
        it('returns an error', async () => {
          const response = await graphql({
            schema,
            source: `
              mutation {
                updateOrganization(
                  input: {
                    id: "${toGlobalId('organization', 123)}",
                    nameEN: "Treasury Board of Canada Secretariat"
                  }
                ) {
                  result {
                    ... on Organization {
                      acronym
                      name
                      zone
                      sector
                      country
                      province
                      city
                    }
                    ... on OrganizationError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            rootValue: null,
            contextValue: {
              i18n,
              query: jest.fn().mockReturnValue({ count: 1 }),
              collections: collectionNames,
              transaction,
              userKey: 123,
              request: { ip: '127.0.0.1' },
              auth: {
                checkPermission: jest.fn().mockReturnValue('admin'),
                userRequired: jest.fn().mockReturnValue({ _key: 123 }),
                verifiedRequired: jest.fn(),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({
                    name: 'Treasury Board of Canada Secretariat',
                    _key: 123,
                  }),
                },
                loadUserByKey: {
                  load: jest.fn(),
                },
              },
            },
          })

          const error = {
            data: {
              updateOrganization: {
                result: {
                  code: 400,
                  description: "Le nom de l'organisation est déjà utilisé, veuillez en choisir un autre et réessayer.",
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to change the name of org: 123 however it is already in use.`,
          ])
        })
      })
      describe('cursor error occurs', () => {
        describe('when gathering comparison org details', () => {
          it('returns an error', async () => {
            const response = await graphql({
              schema,
              source: `
                mutation {
                  updateOrganization(
                    input: {
                      id: "${toGlobalId('organization', 123)}",
                      cityEN: "A New City"
                    }
                  ) {
                    result {
                      ... on Organization {
                        acronym
                        name
                        zone
                        sector
                        country
                        province
                        city
                      }
                      ... on OrganizationError {
                        code
                        description
                      }
                    }
                  }
                }
              `,
              rootValue: null,
              contextValue: {
                i18n,
                query: jest.fn().mockReturnValue({
                  next() {
                    throw new Error('Database error occurred.')
                  },
                }),
                collections: collectionNames,
                transaction,
                userKey: 123,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn().mockReturnValue({ _key: 123 }),
                  verifiedRequired: jest.fn(),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      name: 'Treasury Board of Canada Secretariat',
                      _key: 123,
                    }),
                  },
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
              },
            })

            const error = [new GraphQLError("Impossible de mettre à jour l'organisation. Veuillez réessayer.")]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Cursor error occurred while retrieving org: 123 for update, err: Error: Database error occurred.`,
            ])
          })
        })
      })
      describe('database error occurs', () => {
        describe('when gathering comparison org details', () => {
          it('returns an error', async () => {
            const response = await graphql({
              schema,
              source: `
                mutation {
                  updateOrganization(
                    input: {
                      id: "${toGlobalId('organization', 123)}",
                      cityEN: "A New City"
                    }
                  ) {
                    result {
                      ... on Organization {
                        acronym
                        name
                        zone
                        sector
                        country
                        province
                        city
                      }
                      ... on OrganizationError {
                        code
                        description
                      }
                    }
                  }
                }
              `,
              rootValue: null,
              contextValue: {
                i18n,
                query: jest.fn().mockRejectedValue(new Error('Database error occurred.')),
                collections: collectionNames,
                transaction,
                userKey: 123,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn().mockReturnValue({ _key: 123 }),
                  verifiedRequired: jest.fn(),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      name: 'Treasury Board of Canada Secretariat',
                      _key: 123,
                    }),
                  },
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
              },
            })

            const error = [new GraphQLError("Impossible de mettre à jour l'organisation. Veuillez réessayer.")]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred while retrieving org: 123 for update, err: Error: Database error occurred.`,
            ])
          })
        })
        describe('when checking to see if orgName is already in use', () => {
          it('throws an error', async () => {
            const response = await graphql({
              schema,
              source: `
                mutation {
                  updateOrganization(
                    input: {
                      id: "${toGlobalId('organization', 123)}",
                      nameEN: "Treasury Board of Canada Secretariat"
                    }
                  ) {
                    result {
                      ... on Organization {
                        acronym
                        name
                        zone
                        sector
                        country
                        province
                        city
                      }
                      ... on OrganizationError {
                        code
                        description
                      }
                    }
                  }
                }
              `,
              rootValue: null,
              contextValue: {
                i18n,
                query: jest.fn().mockRejectedValue(new Error('Database error occurred.')),
                collections: collectionNames,
                transaction,
                userKey: 123,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn().mockReturnValue({ _key: 123 }),
                  verifiedRequired: jest.fn(),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      name: 'Treasury Board of Canada Secretariat',
                      _key: 123,
                    }),
                  },
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
              },
            })

            const error = [new GraphQLError("Impossible de mettre à jour l'organisation. Veuillez réessayer.")]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred during name check when user: 123 attempted to update org: 123, Error: Database error occurred.`,
            ])
          })
        })
      })
      describe('transaction error occurs', () => {
        describe('when updating/inserting new org details', () => {
          it('returns an error', async () => {
            const response = await graphql({
              schema,
              source: `
                mutation {
                  updateOrganization(
                    input: {
                      id: "${toGlobalId('organization', 123)}",
                      cityEN: "A New City"
                    }
                  ) {
                    result {
                      ... on Organization {
                        acronym
                        name
                        zone
                        sector
                        country
                        province
                        city
                      }
                      ... on OrganizationError {
                        code
                        description
                      }
                    }
                  }
                }
              `,
              rootValue: null,
              contextValue: {
                i18n,
                query: jest.fn().mockReturnValue({
                  next: jest.fn().mockReturnValue({
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
                  }),
                }),
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockRejectedValue(new Error('trx step error')),
                  abort: jest.fn(),
                }),
                userKey: 123,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn().mockReturnValue({ _key: 123 }),
                  verifiedRequired: jest.fn(),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      name: 'Treasury Board of Canada Secretariat',
                      _key: 123,
                    }),
                  },
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
              },
            })

            const error = [new GraphQLError("Impossible de mettre à jour l'organisation. Veuillez réessayer.")]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction error occurred while upserting org: 123, err: Error: trx step error`,
            ])
          })
        })
        describe('when committing transaction', () => {
          it('returns an error', async () => {
            const response = await graphql({
              schema,
              source: `
                mutation {
                  updateOrganization(
                    input: {
                      id: "${toGlobalId('organization', 123)}",
                      cityEN: "A New City"
                    }
                  ) {
                    result {
                      ... on Organization {
                        acronym
                        name
                        zone
                        sector
                        country
                        province
                        city
                      }
                      ... on OrganizationError {
                        code
                        description
                      }
                    }
                  }
                }
              `,
              rootValue: null,
              contextValue: {
                i18n,
                query: jest.fn().mockReturnValue({
                  next: jest.fn().mockReturnValue({
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
                  }),
                }),
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn(),
                  commit: jest.fn().mockRejectedValue(new Error('trx commit error')),
                  abort: jest.fn(),
                }),
                userKey: 123,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn().mockReturnValue({ _key: 123 }),
                  verifiedRequired: jest.fn(),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      name: 'Treasury Board of Canada Secretariat',
                      _key: 123,
                    }),
                  },
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
              },
            })

            const error = [new GraphQLError("Impossible de mettre à jour l'organisation. Veuillez réessayer.")]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction error occurred while committing org: 123, err: Error: trx commit error`,
            ])
          })
        })
      })
    })
  })
})
