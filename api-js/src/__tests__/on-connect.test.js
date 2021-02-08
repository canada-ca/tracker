import { ArangoTools, dbNameFromFile } from 'arango-tools'

import { makeMigrations } from '../../migrations'
import { customOnConnect } from '../on-connect'
import { verifyToken, tokenize, userRequired } from '../auth'
import { createI18n } from '../create-i18n'
import { userLoaderByKey } from '../user/loaders'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the customOnConnect function', () => {
  let mockedUserRequired
  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)

  beforeAll(() => {
    console.info = mockedInfo
    console.warn = mockedWarn
    mockedUserRequired = jest.fn().mockReturnValue(() => true)
  })

  afterEach(() => {
    consoleOutput.length = 0
  })

  describe('checking that language is set', () => {
    describe('language is set to english', () => {
      it('is set in the returned object', async () => {
        const token = tokenize({ parameters: { userKey: '1234' } })
        const headers = {}
        headers['accept-language'] = 'en'

        const webSocket = {
          upgradeReq: {
            headers,
          },
        }

        const connectionParams = {
          authorization: token,
        }

        const onConnect = await customOnConnect(
          {},
          createI18n,
          verifyToken,
          mockedUserRequired,
          userLoaderByKey,
        )(connectionParams, webSocket)

        expect(onConnect.language).toEqual('en')
        expect(consoleOutput).toEqual([
          'User: 1234, connected to subscription.',
        ])
      })
    })
    describe('language is set to french', () => {
      it('is set in the returned object', async () => {
        const token = tokenize({ parameters: { userKey: '1234' } })
        const headers = {}
        headers['accept-language'] = 'fr'

        const webSocket = {
          upgradeReq: {
            headers,
          },
        }

        const connectionParams = {
          authorization: token,
        }

        const onConnect = await customOnConnect(
          {},
          createI18n,
          verifyToken,
          mockedUserRequired,
          userLoaderByKey,
        )(connectionParams, webSocket)

        expect(onConnect.language).toEqual('fr')
        expect(consoleOutput).toEqual([
          'User: 1234, connected to subscription.',
        ])
      })
    })
  })
  describe('authorization token is set', () => {
    it('has authorization set in the returned object', async () => {
      const token = tokenize({ parameters: { userKey: '1234' } })
      const headers = {}
      headers['accept-language'] = 'en'

      const webSocket = {
        upgradeReq: {
          headers,
        },
      }

      const connectionParams = {
        authorization: token,
      }

      const onConnect = await customOnConnect(
        {},
        createI18n,
        verifyToken,
        mockedUserRequired,
        userLoaderByKey,
      )(connectionParams, webSocket)

      expect(onConnect.authorization).toEqual(token)
      expect(consoleOutput).toEqual(['User: 1234, connected to subscription.'])
    })
  })
  describe('authorization token is not set', () => {
    let query, drop, truncate, migrate

    beforeAll(async () => {
      ;({ migrate } = await ArangoTools({ rootPass, url }))
      ;({ query, drop, truncate } = await migrate(
        makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
      ))
    })

    afterEach(async () => {
      await truncate()
    })

    afterAll(async () => {
      await drop()
    })

    describe('language is set to english', () => {
      it('throws an error', async () => {
        const headers = {}
        headers['accept-language'] = 'en'

        const webSocket = {
          upgradeReq: {
            headers,
          },
        }

        const connectionParams = {}

        try {
          await customOnConnect(
            { query },
            createI18n,
            verifyToken,
            userRequired,
            userLoaderByKey,
          )(connectionParams, webSocket)
        } catch (err) {
          expect(err).toEqual(
            new Error('Authentication error. Please sign in.'),
          )
        }
        expect(consoleOutput).toEqual([
          'User attempted to access controlled content, but userKey was undefined.',
        ])
      })
    })
  })
})
