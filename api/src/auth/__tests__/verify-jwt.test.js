import jwt from 'jsonwebtoken'
import {setupI18n} from '@lingui/core'

import {verifyToken} from '../index'
import englishMessages from '../../locale/en/messages'
import frenchMessages from '../../locale/fr/messages'

const {AUTHENTICATED_KEY} = process.env

describe('given a encoded token', () => {
  let consoleOutput = []
  let i18n
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  beforeEach(() => {
    console.info = mockedInfo
    console.warn = mockedWarn
  })

  afterEach(() => {
    consoleOutput = []
  })
  describe('token can be decoded and verified', () => {
    it('returns the parameters', () => {
      const parameters = {
        userKey: 1,
      }
      const token = jwt.sign({parameters}, String(AUTHENTICATED_KEY), {
        algorithm: 'HS256',
      })

      const testVerify = verifyToken({i18n})
      const decoded = testVerify({token})
      expect(decoded.userKey).toEqual(1)
    })
  })
  describe('language is set to english', () => {
    beforeAll(() => {
      i18n = setupI18n({
        locale: 'en',
        localeData: {
          en: {plurals: {}},
          fr: {plurals: {}},
        },
        locales: ['en', 'fr'],
        messages: {
          en: englishMessages.messages,
          fr: frenchMessages.messages,
        },
      })
    })
    describe('if the secret does not match', () => {
      it('raises an error', () => {
        const parameters = {
          userKey: 1,
        }
        const token = jwt.sign({parameters}, 'superSecretKey', {
          algorithm: 'HS256',
        })

        const testVerify = verifyToken({i18n})
        expect(() => {
          testVerify({token})
        }).toThrow(Error('Invalid token, please sign in.'))
        expect(consoleOutput).toEqual([
          `JWT was attempted to be verified but secret was incorrect.`,
        ])
      })
    })
  })
  describe('language is set to french', () => {
    beforeAll(() => {
      i18n = setupI18n({
        locale: 'fr',
        localeData: {
          en: {plurals: {}},
          fr: {plurals: {}},
        },
        locales: ['en', 'fr'],
        messages: {
          en: englishMessages.messages,
          fr: frenchMessages.messages,
        },
      })
    })
    describe('if the secret does not match', () => {
      it('raises an error', () => {
        const parameters = {
          userKey: 1,
        }
        const token = jwt.sign({parameters}, 'superSecretKey', {
          algorithm: 'HS256',
        })

        const testVerify = verifyToken({i18n})
        expect(() => {
          testVerify({token})
        }).toThrow(Error('Jeton invalide, veuillez vous connecter.'))
        expect(consoleOutput).toEqual([
          `JWT was attempted to be verified but secret was incorrect.`,
        ])
      })
    })
  })
})
