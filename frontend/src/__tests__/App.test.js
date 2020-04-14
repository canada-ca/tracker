import React from 'react'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter } from 'react-router-dom'
import { waitFor, render, cleanup } from '@testing-library/react'
import { MockedProvider } from '@apollo/react-testing'
import gql from 'graphql-tag'
import { UserStateProvider } from '../UserState'
import App from '../App'

i18n.load('en', { en: {} })
i18n.activate('en')

const resolvers = {
  Query: {
    jwt: () => null,
    tfa: () => null,
  },
}

const mocks = [
  {
    request: {
      query: gql`
        {
          domains(organization: BOC) {
            edges {
              node {
                url
              }
            }
          }
        }
      `,
      variables: {},
    },
    result: {
      data: {
        domains: {
          edges: [
            {
              node: {
                url: 'canada.ca',
              },
            },
            {
              node: {
                url: 'alpha.canada.ca',
              },
            },
          ],
        },
      },
    },
  },
]

describe('<App/>', () => {
  afterEach(cleanup)

  describe('routes', () => {
    describe('/', () => {
      it('renders the main page', async () => {
        const { getByRole } = render(
          <UserStateProvider
            initialState={{ userName: null, jwt: null, tfa: null }}
          >
            <ThemeProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <MemoryRouter initialEntries={['/']} initialIndex={0}>
                  <MockedProvider resolvers={resolvers} mocks={mocks}>
                    <App />
                  </MockedProvider>
                </MemoryRouter>
              </I18nProvider>
            </ThemeProvider>
          </UserStateProvider>,
        )
        await waitFor(() =>
          expect(getByRole('heading')).toHaveTextContent(/track web/i),
        )
      })
    })

    describe('/domains', () => {
      it('renders the domains page', async () => {
        const { queryByText } = render(
          <UserStateProvider
            initialState={{ userName: null, jwt: null, tfa: null }}
          >
            <ThemeProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <MemoryRouter initialEntries={['/domains']} initialIndex={0}>
                  <MockedProvider
                    mocks={mocks}
                    resolvers={resolvers}
                    addTypename={false}
                  >
                    <App />
                  </MockedProvider>
                </MemoryRouter>
              </I18nProvider>
            </ThemeProvider>
          </UserStateProvider>,
        )
        await waitFor(() => {
          expect(queryByText(/Domains/i)).toBeInTheDocument()
        })
      })
    })
  })
})
