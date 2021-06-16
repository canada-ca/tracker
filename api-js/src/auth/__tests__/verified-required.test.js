import { setupI18n } from '@lingui/core'

import { verifiedRequired } from '../index'
import englishMessages from '../../locale/en/messages'
import frenchMessages from '../../locale/fr/messages'

describe('given the verifiedRequired function', () => {
  let i18n, user

  const consoleOutput = []
  const mockedWarn = (output) => consoleOutput.push(output)

  beforeAll(() => {
    console.warn = mockedWarn
  })
  afterEach(() => {
    consoleOutput.length = 0
  })

  describe('provided an email validated user', () => {
    beforeEach(() => {
      user = {
        userName: 'test.account@istio.actually.exists',
        displayName: 'Test Account',
        preferredLang: 'french',
        tfaValidated: false,
        emailValidated: true,
      }
    })
    it('returns true', () => {
      const verifiedFunc = verifiedRequired({})

      const verifiedUser = verifiedFunc({ user })

      expect(verifiedUser).toBe(true)
    })
  })
  describe('language is set to english', () => {
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
    describe('user is not email validated', () => {
      beforeEach(() => {
        user = {
          userName: 'test.account@istio.actually.exists',
          displayName: 'Test Account',
          preferredLang: 'french',
          tfaValidated: false,
          emailValidated: false,
        }
      })
      it('throws an error', () => {
        const verifiedFunc = verifiedRequired({ i18n })

        try {
          verifiedFunc({ user })
        } catch (err) {
          expect(err).toEqual(
            new Error(
              'Verification error. Please verify your account via email to access content.',
            ),
          )
        }
      })
    })
  })
  describe('language is set to french', () => {
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
    describe('user is not email validated', () => {
      beforeEach(() => {
        user = {
          userName: 'test.account@istio.actually.exists',
          displayName: 'Test Account',
          preferredLang: 'french',
          tfaValidated: false,
          emailValidated: false,
        }
      })
      it('throws an error', () => {
        const verifiedFunc = verifiedRequired({ i18n })

        try {
          verifiedFunc({ user })
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }
      })
    })
  })
})
