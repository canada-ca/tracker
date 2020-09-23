import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter } from 'react-router-dom'
import { waitFor, render, cleanup } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { UserStateProvider } from '../UserState'
import { WEB_AND_EMAIL_SUMMARIES, DOMAINS } from '../graphql/queries'
import App from '../App'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'

describe('<App/>', () => {
  afterEach(cleanup)

  describe('routes', () => {
    describe('/', () => {
      const mocks = [
        {
          request: {
            query: WEB_AND_EMAIL_SUMMARIES,
          },
          result: {
            data: {
              webSummary: {
                categories: [
                  {
                    name: 'full-pass',
                    count: 1214,
                    percentage: 13.5,
                  },
                  {
                    name: 'full-fail',
                    count: 7798,
                    percentage: 86.5,
                  },
                ],
                total: 9012,
              },
              emailSummary: {
                categories: [
                  {
                    name: 'full-pass',
                    count: 5872,
                    percentage: 25.5,
                  },
                  {
                    name: 'full-fail',
                    count: 9949,
                    percentage: 43.2,
                  },
                  {
                    name: 'partial-pass',
                    count: 7216,
                    percentage: 31.3,
                  },
                ],
                total: 23037,
              },
            },
          },
        },
      ]
      it('renders the main page', async () => {
        const { getByText } = render(
          <UserStateProvider
            initialState={{ userName: null, jwt: null, tfa: null }}
          >
            <ThemeProvider theme={theme}>
              <I18nProvider i18n={setupI18n()}>
                <MemoryRouter initialEntries={['/']} initialIndex={0}>
                  <MockedProvider mocks={mocks} addTypename={false}>
                    <App />
                  </MockedProvider>
                </MemoryRouter>
              </I18nProvider>
            </ThemeProvider>
          </UserStateProvider>,
        )
        await waitFor(() => expect(getByText(/Track web security compliance/i)))
      })
    })

    describe('/domains', () => {
      const mocks = [
        {
          request: {
            query: DOMAINS,
          },
          result: {
            data: {
              domains: {
                edges: [
                  {
                    node: {
                      url: 'rcmp-grc.gc.ca',
                      slug: 'rcmp-grc-gc-ca',
                      lastRan: null,
                    },
                  },
                ],
                pageInfo: {
                  endCursor: 'YXJyYXljb25uZWN0aW9uOjQ=',
                  hasNextPage: false,
                },
              },
            },
          },
        },
      ]
      it('renders the sign-in page', async () => {
        const { getByText } = render(
          <UserStateProvider
            initialState={{ userName: null, jwt: null, tfa: null }}
          >
            <ThemeProvider theme={theme}>
              <I18nProvider i18n={setupI18n()}>
                <MemoryRouter initialEntries={['/sign-in']} initialIndex={0}>
                  <MockedProvider mocks={mocks} addTypename={false}>
                    <App />
                  </MockedProvider>
                </MemoryRouter>
              </I18nProvider>
            </ThemeProvider>
          </UserStateProvider>,
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
