import { ensure, dbNameFromFile } from 'arango-tools'

import { createContext } from '../create-context'
import { customOnConnect } from '../on-connect'
import { verifyToken, tokenize, userRequired } from '../auth'
import { createI18n } from '../create-i18n'
import { databaseOptions } from '../../database-options'

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

        const webSocket = {
          upgradeReq: {},
        }

        const connectionParams = {
          authorization: token,
          AcceptLanguage: 'en',
        }

        const onConnect = await customOnConnect({
          createContext,
          serverContext: {},
          createI18n,
          verifyToken,
          userRequired: mockedUserRequired,
          loadUserByKey: jest.fn(),
          verifiedRequired: jest.fn(),
        })(connectionParams, webSocket, { request: {} })

        expect(onConnect.request.language).toEqual('en')
        expect(consoleOutput).toEqual([
          'User: 1234, connected to subscription.',
        ])
      })
    })
    describe('language is set to french', () => {
      it('is set in the returned object', async () => {
        const token = tokenize({ parameters: { userKey: '1234' } })

        const webSocket = {
          upgradeReq: {},
        }

        const connectionParams = {
          authorization: token,
          AcceptLanguage: 'fr',
        }

        const onConnect = await customOnConnect({
          createContext,
          serverContext: {},
          createI18n,
          verifyToken,
          userRequired: mockedUserRequired,
          loadUserByKey: jest.fn(),
          verifiedRequired: jest.fn(),
        })(connectionParams, webSocket, { request: {} })

        expect(onConnect.request.language).toEqual('fr')
        expect(consoleOutput).toEqual([
          'User: 1234, connected to subscription.',
        ])
      })
    })
  })
  describe('authorization token is set', () => {
    it('has authorization set in the returned object', async () => {
      const token = tokenize({ parameters: { userKey: '1234' } })

      const webSocket = {
        upgradeReq: {},
      }

      const connectionParams = {
        authorization: token,
        AcceptLanguage: 'en',
      }

      const onConnect = await customOnConnect({
        createContext,
        serverContext: {},
        createI18n,
        verifyToken,
        userRequired: mockedUserRequired,
        loadUserByKey: jest.fn(),
        verifiedRequired: jest.fn(),
      })(connectionParams, webSocket, { request: {} })

      expect(onConnect.request.headers.authorization).toEqual(token)
      expect(consoleOutput).toEqual(['User: 1234, connected to subscription.'])
    })
  })
  describe('authorization token is not set', () => {
    let query, drop, truncate

    beforeAll(async () => {
      ;({ query, drop, truncate } = await ensure({
        type: 'database',
        name: dbNameFromFile(__filename),
        url,
        rootPassword: rootPass,
        options: databaseOptions({ rootPass }),
      }))
    })

    afterEach(async () => {
      await truncate()
    })

    afterAll(async () => {
      await drop()
    })

    describe('language is set to english', () => {
      it('throws an error', async () => {
        const webSocket = {
          upgradeReq: {},
        }

        const connectionParams = { AcceptLanguage: 'en' }

        try {
          await customOnConnect({
            createContext,
            serverContext: { query },
            createI18n,
            verifyToken,
            userRequired,
            loadUserByKey: jest.fn().mockReturnValue({ load: jest.fn() }),
          })(connectionParams, webSocket, { request: {} })
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
    describe('language is set to french', () => {
      it('throws an error', async () => {
        const webSocket = {
          upgradeReq: {},
        }

        const connectionParams = { AcceptLanguage: 'fr' }

        try {
          await customOnConnect({
            createContext,
            serverContext: { query },
            createI18n,
            verifyToken,
            userRequired,
            loadUserByKey: jest.fn().mockReturnValue({ load: jest.fn() }),
          })(connectionParams, webSocket, { request: {} })
        } catch (err) {
          expect(err).toEqual(
            new Error("Erreur d'authentification. Veuillez vous connecter."),
          )
        }
        expect(consoleOutput).toEqual([
          'User attempted to access controlled content, but userKey was undefined.',
        ])
      })
    })
  })
})
