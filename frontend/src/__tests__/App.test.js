import React from 'react'
import { theme, ThemeProvider } from '@chakra-ui/react'
import { MemoryRouter } from 'react-router-dom'
import { cleanup, render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { UserVarProvider } from '../UserState'
import App from '../App'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { makeVar } from '@apollo/client'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

describe('<App/>', () => {
  afterEach(cleanup)

  describe('routes', () => {
    describe('/', () => {
      it('renders the main page', async () => {
        const { getByText } = render(
          <MockedProvider>
            <UserVarProvider
              userVar={makeVar({
                jwt: null,
                tfaSendMethod: null,
                userName: null,
              })}
            >
              <ThemeProvider theme={theme}>
                <I18nProvider i18n={i18n}>
                  <MemoryRouter initialEntries={['/']} initialIndex={0}>
                    <App />
                  </MemoryRouter>
                </I18nProvider>
              </ThemeProvider>
            </UserVarProvider>
          </MockedProvider>,
        )
        await waitFor(() => expect(getByText(/Track digital security/i)))
      })
    })

    describe('/domains', () => {
      it('renders the sign-in page', async () => {
        const { getByText } = render(
          <MockedProvider>
            <UserVarProvider
              userVar={makeVar({
                jwt: null,
                tfaSendMethod: null,
                userName: null,
              })}
            >
              <ThemeProvider theme={theme}>
                <I18nProvider i18n={i18n}>
                  <MemoryRouter initialEntries={['/sign-in']} initialIndex={0}>
                    <App />
                  </MemoryRouter>
                </I18nProvider>
              </ThemeProvider>
            </UserVarProvider>
          </MockedProvider>,
        )
        const domains = await waitFor(() =>
          getByText(/Sign in with your username and password./i),
        )
        await waitFor(() => {
          expect(domains).toBeInTheDocument()
        })
      })
    })
  })
})
