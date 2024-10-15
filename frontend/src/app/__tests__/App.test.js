import React from 'react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { MemoryRouter } from 'react-router-dom'
import { cleanup, render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { makeVar } from '@apollo/client'
import { en } from 'make-plural/plurals'

import { App } from '../App'

import { UserVarProvider } from '../../utilities/userState'
import { REFRESH_TOKENS } from '../../graphql/mutations'
import { IS_LOGIN_REQUIRED } from '../../graphql/queries'
import { TourProvider } from '../../userOnboarding/contexts/TourContext'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: { plurals: en },
  },
})

const mocks = [
  {
    request: {
      query: REFRESH_TOKENS,
    },
    result: {
      data: {
        refreshTokens: {
          result: {
            code: 400,
            description: 'Unable to refresh tokens, please sign in.',
            __typename: 'AuthenticateError',
          },
          __typename: 'RefreshTokensPayload',
        },
      },
    },
  },
  {
    request: {
      query: IS_LOGIN_REQUIRED,
    },
    result: {
      data: {
        loginRequired: false,
      },
    },
  },
]

describe('<App/>', () => {
  afterEach(cleanup)

  describe('routes', () => {
    describe('/', () => {
      it('renders the main page', async () => {
        const { getAllByText } = render(
          <MockedProvider mocks={mocks}>
            <UserVarProvider
              userVar={makeVar({
                jwt: null,
                tfaSendMethod: null,
                userName: null,
              })}
            >
              <ChakraProvider theme={theme}>
                <I18nProvider i18n={i18n}>
                  <MemoryRouter initialEntries={['/']} initialIndex={0}>
                    <TourProvider>
                      <App />
                    </TourProvider>
                  </MemoryRouter>
                </I18nProvider>
              </ChakraProvider>
            </UserVarProvider>
          </MockedProvider>,
        )
        await waitFor(() => expect(getAllByText(/Track digital security/i)))
      })
    })

    describe('/domains', () => {
      it('renders the sign-in page', async () => {
        const { getByText } = render(
          <MockedProvider mocks={mocks}>
            <UserVarProvider
              userVar={makeVar({
                jwt: null,
                tfaSendMethod: null,
                userName: null,
              })}
            >
              <ChakraProvider theme={theme}>
                <I18nProvider i18n={i18n}>
                  <MemoryRouter initialEntries={['/sign-in']} initialIndex={0}>
                    <TourProvider>
                      <App />
                    </TourProvider>
                  </MemoryRouter>
                </I18nProvider>
              </ChakraProvider>
            </UserVarProvider>
          </MockedProvider>,
        )
        const domains = await waitFor(() => getByText(/Login to your account/i))
        await waitFor(() => {
          expect(domains).toBeInTheDocument()
        })
      })
    })
  })

  describe('user is logged in', () => {
    it('does not render <VerifyAccountNotificationBar />', () => {
      const { queryByText } = render(
        <MockedProvider>
          <UserVarProvider
            userVar={makeVar({
              jwt: null,
              tfaSendMethod: null,
              userName: null,
            })}
          >
            <ChakraProvider theme={theme}>
              <MemoryRouter initialEntries={['/']}>
                <I18nProvider i18n={i18n}>
                  <TourProvider>
                    <App />
                  </TourProvider>
                </I18nProvider>
              </MemoryRouter>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      expect(
        queryByText(/To enable full app functionality and maximize your account's security/),
      ).not.toBeInTheDocument()
    })
  })

  describe('user is logged in', () => {
    it('renders <VerifyAccountNotificationBar /> when user not verified', async () => {
      const { getByText } = render(
        <MockedProvider>
          <UserVarProvider
            userVar={makeVar({
              jwt: 'test-jwt',
              tfaSendMethod: 'NONE',
              userName: 'test@email.com',
            })}
          >
            <ChakraProvider theme={theme}>
              <MemoryRouter initialEntries={['/']}>
                <I18nProvider i18n={i18n}>
                  <TourProvider>
                    <App />
                  </TourProvider>
                </I18nProvider>
              </MemoryRouter>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )
      await waitFor(() =>
        expect(getByText(/To enable full app functionality and maximize your account's security/)).toBeInTheDocument(),
      )
    })
    it('does not render <VerifyAccountNotificationBar /> if user is verified', () => {
      const { queryByText } = render(
        <MockedProvider>
          <UserVarProvider
            userVar={makeVar({
              jwt: null,
              tfaSendMethod: null,
              userName: null,
            })}
          >
            <ChakraProvider theme={theme}>
              <MemoryRouter initialEntries={['/']}>
                <I18nProvider i18n={i18n}>
                  <TourProvider>
                    <App />
                  </TourProvider>
                </I18nProvider>
              </MemoryRouter>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )
      expect(
        queryByText(/To enable full app functionality and maximize your account's security/),
      ).not.toBeInTheDocument()
    })
  })

  describe('When login is not required', () => {
    it('displays additional navbar options', async () => {
      const { queryByRole } = render(
        <MockedProvider mocks={mocks}>
          <UserVarProvider
            userVar={makeVar({
              jwt: null,
              tfaSendMethod: null,
              userName: null,
            })}
          >
            <ChakraProvider theme={theme}>
              <MemoryRouter initialEntries={['/']}>
                <I18nProvider i18n={i18n}>
                  <TourProvider>
                    <App />
                  </TourProvider>
                </I18nProvider>
              </MemoryRouter>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )
      await waitFor(() => expect(queryByRole('link', { name: 'Organizations', hidden: false })).toBeInTheDocument())
    })
  })
})
