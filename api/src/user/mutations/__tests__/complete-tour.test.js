import { dbNameFromFile } from 'arango-tools'
import { createUserContextGenerator, ensureDatabase as ensure } from '../../../testUtilities'
import { graphql, GraphQLSchema } from 'graphql'

import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import dbschema from '../../../../database.json'
import { collectionNames } from '../../../collection-names'
import { createI18n } from '../../../create-i18n'
import { toGlobalId } from 'graphql-relay/index'

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

let db, query, drop, truncate, collections, transaction, createUserContext, normalUser, normalUserContext

describe('complete tour mutation', () => {
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
  })

  afterEach(async () => {
    consoleOutput.length = 0
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

  it('adds completed tour on successful mutation', async () => {
    const currentUserState = await (await query`RETURN DOCUMENT(users, ${normalUser._key})`).next()

    expect(currentUserState?.completedTours).toBeUndefined()

    const tourToCompleteOne = 'tour1'

    const response = await graphql({
      schema,
      source: `
        mutation {
          completeTour(input: { tourId: "${tourToCompleteOne}" }) {
            result {
              ... on CompleteTourResult {
                status
                user {
                  id
                  completedTours {
                    tourId
                    completedAt
                  }
                }
              }
              ... on CompleteTourError {
                code
                description
              }
            }
          }
        }
      `,
      rootValue: null,
      contextValue: normalUserContext,
    })

    const tourOneCompleteTime = response?.data?.completeTour?.result?.user?.completedTours?.[0]?.completedAt
    expect(!!tourOneCompleteTime).not.toBeFalsy()

    const expectedResponse = {
      data: {
        completeTour: {
          result: {
            status: 'Tour completion confirmed successfully',
            user: {
              id: toGlobalId('user', normalUser._key),
              completedTours: [
                {
                  tourId: tourToCompleteOne,
                  completedAt: tourOneCompleteTime,
                },
              ],
            },
          },
        },
      },
    }

    expect(response).toEqual(expectedResponse)

    const tourToCompleteTwo = 'tour2'

    const responseTwo = await graphql({
      schema,
      source: `
        mutation {
          completeTour(input: { tourId: "${tourToCompleteTwo}" }) {
            result {
              ... on CompleteTourResult {
                status
                user {
                  id
                  completedTours {
                    tourId
                    completedAt
                  }
                }
              }
              ... on CompleteTourError {
                code
                description
              }
            }
          }
        }
      `,
      rootValue: null,
      contextValue: normalUserContext,
    })

    const tourTwoCompleteTime = responseTwo?.data?.completeTour?.result?.user?.completedTours?.[1]?.completedAt
    expect(!!tourTwoCompleteTime).not.toBeFalsy()

    const expectedResponseTwo = {
      data: {
        completeTour: {
          result: {
            status: 'Tour completion confirmed successfully',
            user: {
              id: toGlobalId('user', normalUser._key),
              completedTours: [
                {
                  tourId: tourToCompleteOne,
                  completedAt: tourOneCompleteTime,
                },
                {
                  tourId: tourToCompleteTwo,
                  completedAt: tourTwoCompleteTime,
                },
              ],
            },
          },
        },
      },
    }

    expect(responseTwo).toEqual(expectedResponseTwo)
  })
  it('updates timestamp for re-completed tour', async () => {
    const tourToComplete = 'tour1'
    await query`UPDATE { _key: ${normalUser._key}} WITH { completedTours: [{tourId: ${tourToComplete}, completedAt: DATE_ISO8601(DATE_NOW())}]} IN users`
    const currentUserState = await (await query`RETURN DOCUMENT(users, ${normalUser._key})`).next()

    expect(currentUserState?.completedTours).toHaveLength(1)

    const originalCompletedAt = currentUserState?.completedTours[0].completedAt
    expect(!!originalCompletedAt).not.toBeFalsy()

    const _response = await graphql({
      schema,
      source: `
        mutation {
          completeTour(input: { tourId: "${tourToComplete}" }) {
            result {
              ... on CompleteTourResult {
                status
                user {
                  id
                  completedTours {
                    tourId
                    completedAt
                  }
                }
              }
              ... on CompleteTourError {
                code
                description
              }
            }
          }
        }
      `,
      rootValue: null,
      contextValue: normalUserContext,
    })

    const newUserState = await (await query`RETURN DOCUMENT(users, ${normalUser._key})`).next()
    expect(newUserState?.completedTours).toHaveLength(1)
    expect(new Date(newUserState.completedTours[0].completedAt) > new Date(originalCompletedAt)).toBe(true)
  })
  it('throws an error when tourId is empty after input cleansing', async () => {
    const response = await graphql({
      schema,
      source: `
        mutation {
          completeTour(input: { tourId: "  " }) {
            result {
              ... on CompleteTourResult {
                status
                user {
                  id
                  completedTours {
                    tourId
                    completedAt
                  }
                }
              }
              ... on CompleteTourError {
                code
                description
              }
            }
          }
        }
      `,
      rootValue: null,
      contextValue: normalUserContext,
    })

    const expectedResponse = {
      data: {
        completeTour: {
          result: {
            code: 400,
            description: 'Unable to confirm completion of the tour. Please try again.',
          },
        },
      },
    }

    expect(response).toEqual(expectedResponse)
    expect(consoleOutput).toHaveLength(1)
    expect(consoleOutput[0]).toEqual(
      `User: ${normalUser._key} did not provide a tour id when attempting to confirm completion of the tour.`,
    )
  })
})
