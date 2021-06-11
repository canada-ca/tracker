import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter, Route } from 'react-router-dom'
import { render, waitFor } from '@testing-library/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { MockedProvider } from '@apollo/client/testing'
import { UserStateProvider } from '../UserState'
import EmailValidationPage from '../EmailValidationPage'
import { VERIFY_ACCOUNT } from '../graphql/mutations'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

const successMocks = [
  {
    request: {
      query: VERIFY_ACCOUNT,
      variables: {
        verifyToken: 'fwsdGDFSGSDVA.gedafbedafded.bgdbsedbeagbe',
      },
    },
    result: {
      data: {
        verifyAccount: {
          result: {
            status: 'Hello World',
            __typename: 'VerifyAccountResult',
          },
        },
      },
    },
  },
]

const failMocks = [
  {
    request: {
      query: VERIFY_ACCOUNT,
    },
    result: {
      data: {
        verifyAccount: {
          result: {
            code: -96,
            description: 'Hello World',
            __typename: 'VerifyAccountError',
          },
        },
      },
    },
  },
]

describe('<EmailValidationPage />', () => {
  describe('on render', () => {
    it('page renders', async () => {
      const { queryByText } = render(
        <UserStateProvider
          initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
        >
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MockedProvider mocks={successMocks}>
                <MemoryRouter
                  initialEntries={[
                    '/validate/fwsdGDFSGSDVA.gedafbedafded.bgdbsedbeagbe',
                  ]}
                  initialIndex={0}
                >
                  <Route path="/validate/:verifyToken">
                    <EmailValidationPage />
                  </Route>
                </MemoryRouter>
              </MockedProvider>
            </I18nProvider>
          </ThemeProvider>
        </UserStateProvider>,
      )

      await waitFor(() =>
        expect(queryByText(/Email Validation Page/)).toBeInTheDocument(),
      )
    })
  })

  describe('after loading mutation', () => {
    it('displays an error message', async () => {
      const { queryByText } = render(
        <UserStateProvider
          initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
        >
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MockedProvider mocks={failMocks}>
                <MemoryRouter
                  initialEntries={[
                    '/validate/fwsdGDFSGSDVA.gedafbedafded.bgdbsedbeagbe',
                  ]}
                  initialIndex={0}
                >
                  <Route path="/validate/:verifyToken">
                    <EmailValidationPage />
                  </Route>
                </MemoryRouter>
              </MockedProvider>
            </I18nProvider>
          </ThemeProvider>
        </UserStateProvider>,
      )

      await waitFor(() =>
        expect(
          queryByText(
            /Your account email could not be verified at this time. Please try again./,
          ),
        ).toBeInTheDocument(),
      )
    })

    it('displays a success message', async () => {
      const { queryByText } = render(
        <UserStateProvider
          initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
        >
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MockedProvider mocks={successMocks}>
                <MemoryRouter
                  initialEntries={[
                    '/validate/fwsdGDFSGSDVA.gedafbedafded.bgdbsedbeagbe',
                  ]}
                  initialIndex={0}
                >
                  <Route path="/validate/:verifyToken">
                    <EmailValidationPage />
                  </Route>
                </MemoryRouter>
              </MockedProvider>
            </I18nProvider>
          </ThemeProvider>
        </UserStateProvider>,
      )

      await waitFor(() =>
        expect(
          queryByText(/Your account email was successfully verified/),
        ).toBeInTheDocument(),
      )
    })
  })
})
