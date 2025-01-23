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

describe('dismiss message mutation', () => {
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

  it('adds dismissed message on successful mutation', async () => {
    const currentUserState = await (await query`RETURN DOCUMENT(users, ${normalUser._key})`).next()

    expect(currentUserState?.dismissedMessages).toBeUndefined()

    const messageToIgnoreOne = 'message1'

    const response = await graphql({
      schema,
      source: `
        mutation {
          dismissMessage(input: { messageId: "${messageToIgnoreOne}" }) {
            result {
              ... on DismissMessageResult {
                status
                user {
                  id
                  dismissedMessages {
                    messageId
                    dismissedAt
                  }
                }
              }
              ... on DismissMessageError {
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

    const messageOneDismissTime = response?.data?.dismissMessage?.result?.user?.dismissedMessages?.[0]?.dismissedAt
    expect(!!messageOneDismissTime).not.toBeFalsy()

    const expectedResponse = {
      data: {
        dismissMessage: {
          result: {
            status: 'Message dismissed successfully',
            user: {
              id: toGlobalId('user', normalUser._key),
              dismissedMessages: [
                {
                  messageId: messageToIgnoreOne,
                  dismissedAt: messageOneDismissTime,
                },
              ],
            },
          },
        },
      },
    }

    expect(response).toEqual(expectedResponse)

    const messageToIgnoreTwo = 'message2'

    const responseTwo = await graphql({
      schema,
      source: `
        mutation {
          dismissMessage(input: { messageId: "${messageToIgnoreTwo}" }) {
            result {
              ... on DismissMessageResult {
                status
                user {
                  id
                  dismissedMessages {
                    messageId
                    dismissedAt
                  }
                }
              }
              ... on DismissMessageError {
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

    const messageTwoDismissTime = responseTwo?.data?.dismissMessage?.result?.user?.dismissedMessages?.[1]?.dismissedAt
    expect(!!messageTwoDismissTime).not.toBeFalsy()

    const expectedResponseTwo = {
      data: {
        dismissMessage: {
          result: {
            status: 'Message dismissed successfully',
            user: {
              id: toGlobalId('user', normalUser._key),
              dismissedMessages: [
                {
                  messageId: messageToIgnoreOne,
                  dismissedAt: messageOneDismissTime,
                },
                {
                  messageId: messageToIgnoreTwo,
                  dismissedAt: messageTwoDismissTime,
                },
              ],
            },
          },
        },
      },
    }

    expect(responseTwo).toEqual(expectedResponseTwo)
  })
  it('updates timestamp for re-ignored message', async () => {
    const messageToIgnore = 'message1'
    await query`UPDATE { _key: ${normalUser._key}} WITH { dismissedMessages: [{messageId: ${messageToIgnore}, dismissedAt: DATE_NOW()}]} IN users`
    const currentUserState = await (await query`RETURN DOCUMENT(users, ${normalUser._key})`).next()

    expect(currentUserState?.dismissedMessages).toHaveLength(1)

    const originalDismissedAt = currentUserState?.dismissedMessages[0].dismissedAt
    expect(!!originalDismissedAt).not.toBeFalsy()

    const _response = await graphql({
      schema,
      source: `
        mutation {
          dismissMessage(input: { messageId: "${messageToIgnore}" }) {
            result {
              ... on DismissMessageResult {
                status
                user {
                  id
                  dismissedMessages {
                    messageId
                    dismissedAt
                  }
                }
              }
              ... on DismissMessageError {
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
    expect(newUserState?.dismissedMessages).toHaveLength(1)
    expect(newUserState.dismissedMessages[0].dismissedAt).toBeGreaterThan(
      currentUserState.dismissedMessages[0].dismissedAt,
    )
  })
  it('throws an error when messageId is empty after input cleansing', async () => {
    const response = await graphql({
      schema,
      source: `
        mutation {
          dismissMessage(input: { messageId: "  " }) {
            result {
              ... on DismissMessageResult {
                status
                user {
                  id
                  dismissedMessages {
                    messageId
                    dismissedAt
                  }
                }
              }
              ... on DismissMessageError {
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
        dismissMessage: {
          result: {
            code: 400,
            description: 'Unable to dismiss message. Please try again.',
          },
        },
      },
    }

    expect(response).toEqual(expectedResponse)
    expect(consoleOutput).toHaveLength(1)
    expect(consoleOutput[0]).toEqual('User attempted to dismiss message without providing a message id.')
  })
})
