import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter } from 'react-router-dom'
import { waitFor, render, cleanup } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { UserStateProvider } from '../UserState'
import { DOMAINS } from '../graphql/queries'
import App from '../App'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { ApolloProvider } from '@apollo/client'
import { client } from '../client'

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
          <ApolloProvider client={client}>
            <ApolloProvider client={client}>
              <UserStateProvider
                initialState={{
                  userName: null,
                  jwt: null,
                  tfaSendMethod: null,
                }}
              >
                <ThemeProvider theme={theme}>
                  <I18nProvider i18n={i18n}>
                    <MemoryRouter initialEntries={['/']} initialIndex={0}>
                      <ApolloProvider client={client}>
                        <App />
                      </ApolloProvider>
                    </MemoryRouter>
                  </I18nProvider>
                </ThemeProvider>
              </UserStateProvider>
            </ApolloProvider>
          </ApolloProvider>,
        )
        await waitFor(() => expect(getByText(/Track digital security/i)))
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
          <ApolloProvider client={client}>
            <UserStateProvider
              initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
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
            </UserStateProvider>
          </ApolloProvider>,
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
