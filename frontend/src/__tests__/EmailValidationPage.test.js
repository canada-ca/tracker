import React from 'react'
import { theme, ThemeProvider } from '@chakra-ui/core'
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

const mocks = [
  {
    request: {
      query: VERIFY_ACCOUNT,
    },
    result: {
      data: {
        status: 'string',
      },
    },
  },
]

describe('<EmailValidationPage />', () => {
  describe('on render', () => {
    it('page renders', async () => {
      const { queryByText } = render(
        <MockedProvider mocks={mocks}>
          <UserStateProvider
            initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
          >
            <ThemeProvider theme={theme}>
              <I18nProvider i18n={i18n}>
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
              </I18nProvider>
            </ThemeProvider>
          </UserStateProvider>
        </MockedProvider>,
      )

      await waitFor(() =>
        expect(queryByText(/Email Validation Page/)).toBeInTheDocument(),
      )
    })
  })

  describe('after loading mutation', () => {
    it('displays an error message', async () => {
      const { queryByText } = render(
        <MockedProvider mocks={mocks}>
          <UserStateProvider
            initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
          >
            <ThemeProvider theme={theme}>
              <I18nProvider i18n={i18n}>
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
              </I18nProvider>
            </ThemeProvider>
          </UserStateProvider>
        </MockedProvider>,
      )

      await waitFor(() =>
        expect(
          queryByText(
            /Your account email could not be verified at this time. Please try again./,
          ),
        ).toBeInTheDocument(),
      )
    })
  })
})
