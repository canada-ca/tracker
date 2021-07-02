import { graphql, GraphQLSchema } from 'graphql'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'

describe('signing the user out', () => {
  let schema, i18n
  beforeAll(() => {
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
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
    it('clears the token', async () => {
      const mockedCookie = jest.fn()
      const mockedResponse = { cookie: mockedCookie }

      const response = await graphql(
        schema,
        `
          mutation {
            signOut(input: {}) {
              status
            }
          }
        `,
        null,
        {
          i18n,
          response: mockedResponse,
        },
      )

      const expectedResult = {
        data: {
          signOut: {
            status: 'Successfully signed out.',
          },
        },
      }

      expect(response).toEqual(expectedResult)
      expect(mockedCookie).toHaveBeenCalledWith('refresh_token', '', {
        expires: new Date(0),
        httpOnly: true,
        sameSite: true,
        secure: false,
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
    it('clears the token', async () => {
      const mockedCookie = jest.fn()
      const mockedResponse = { cookie: mockedCookie }

      const response = await graphql(
        schema,
        `
          mutation {
            signOut(input: {}) {
              status
            }
          }
        `,
        null,
        {
          i18n,
          response: mockedResponse,
        },
      )

      const expectedResult = {
        data: {
          signOut: {
            status: "J'ai réussi à me déconnecter.",
          },
        },
      }

      expect(response).toEqual(expectedResult)
      expect(mockedCookie).toHaveBeenCalledWith('refresh_token', '', {
        expires: new Date(0),
        httpOnly: true,
        sameSite: true,
        secure: false,
      })
    })
  })
})
