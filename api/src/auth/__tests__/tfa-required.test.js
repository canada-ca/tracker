import { setupI18n } from '@lingui/core'

import { tfaRequired } from '../index'
import englishMessages from '../../locale/en/messages'
import frenchMessages from '../../locale/fr/messages'

describe('given the tfaRequired function', () => {
  let i18n, user

  const consoleOutput = []
  const mockedWarn = (output) => consoleOutput.push(output)

  beforeAll(() => {
    console.warn = mockedWarn
  })
  afterEach(() => {
    consoleOutput.length = 0
  })

  describe('given a successful call', () => {
    describe('provided a tfa activated user', () => {
      beforeEach(() => {
        user = {
          userName: 'test.account@istio.actually.exists',
          displayName: 'Test Account',
          tfaValidated: false,
          emailValidated: true,
          tfaSendMethod: 'email',
        }
      })
      it('returns true', () => {
        const tfaFunc = tfaRequired({})

        const verifiedUser = tfaFunc({ user })

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
      describe('user does not have tfa activated', () => {
        beforeEach(() => {
          user = {
            userName: 'test.account@istio.actually.exists',
            displayName: 'Test Account',
            tfaValidated: false,
            emailValidated: false,
            tfaSendMethod: 'none',
          }
        })
        it('throws an error', () => {
          const tfaFunc = tfaRequired({ i18n })

          try {
            tfaFunc({ user })
          } catch (err) {
            expect(err).toEqual(
              new Error('Verification error. Please activate multi-factor authentication to access content.'),
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
          locales: ['fr'],
          messages: {
            fr: frenchMessages.messages,
          },
        })
      })
      describe('user does not have tfa activated', () => {
        beforeEach(() => {
          user = {
            userName: 'test.account@istio.actually.exists',
            displayName: 'Test Account',
            tfaValidated: false,
            emailValidated: false,
            tfaSendMethod: 'none',
          }
        })
        it.skip('throws an error', () => {
          const tfaFunc = tfaRequired({ i18n })

          try {
            tfaFunc({ user })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                "Erreur de vérification. Veuillez activer l'authentification multifactorielle pour accéder au contenu.",
              ),
            )
          }
        })
      })
    })
  })
})
