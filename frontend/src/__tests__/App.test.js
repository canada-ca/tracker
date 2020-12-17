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
                    name: 'pass',
                    count: 7468,
                    percentage: 56.6,
                  },
                  {
                    name: 'fail',
                    count: 5738,
                    percentage: 43.4,
                  },
                ],
                total: 13206,
              },
              mailSummary: {
                categories: [
                  {
                    name: 'pass',
                    count: 2091,
                    percentage: 11.2,
                  },
                  {
                    name: 'fail',
                    count: 8604,
                    percentage: 46.2,
                  },
                ],
                total: 18613,
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
              <I18nProvider i18n={i18n}>
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
              <I18nProvider i18n={i18n}>
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
