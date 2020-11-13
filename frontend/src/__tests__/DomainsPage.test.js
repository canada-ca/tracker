import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import {
  PAGINATED_DOMAINS,
  REVERSE_PAGINATED_DOMAINS,
} from '../graphql/queries'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'
import { createCache } from '../client'
import DomainsPage from '../DomainsPage'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

const fillIn = (element, { with: value }) =>
  fireEvent.change(element, { target: { value } })

describe('<DomainsPage />', () => {
  const mocks = [
    {
      request: {
        query: PAGINATED_DOMAINS,
        variables: { first: 2 },
      },
      result: {
        data: {
          pagination: {
            edges: [
              {
                cursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                node: {
                  id: 'T3JnYW5pemF0aW9uczoyCg==',
                  url: 'tbs-sct.gc.ca',
                  slug: 'tbs-sct-gc-ca',
                  lastRan: 'somedate',
                  __typename: 'Domains',
                },
                __typename: 'DomainsEdge',
              },
              {
                cursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                node: {
                  id: 'T3JnYW5pemF0aW9uczoxCg==',
                  url: 'rcmp-grc.gc.ca',
                  slug: 'rcmp-grc-gc-ca',
                  lastRan: 'organization-two',
                  __typename: 'Domains',
                },
                __typename: 'DomainsEdge',
              },
            ],
            pageInfo: {
              hasNextPage: true,
              endCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
              hasPreviousPage: false,
              startCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
              __typename: 'PageInfo',
            },
            __typename: 'DomainsConnection',
          },
        },
      },
    },
    {
      request: {
        query: PAGINATED_DOMAINS,
        variables: { first: 2 },
      },
      result: {
        data: {
          pagination: {
            edges: [
              {
                cursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                node: {
                  id: 'T3JnYW5pemF0aW9uczoyCg==',
                  url: 'tbs-sct.gc.ca',
                  slug: 'tbs-sct-gc-ca',
                  lastRan: 'somedate',
                  __typename: 'Domains',
                },
                __typename: 'DomainsEdge',
              },
              {
                cursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                node: {
                  id: 'T3JnYW5pemF0aW9uczoxCg==',
                  url: 'rcmp-grc.gc.ca',
                  slug: 'rcmp-grc-gc-ca',
                  lastRan: 'organization-two',
                  __typename: 'Domains',
                },
                __typename: 'DomainsEdge',
              },
            ],
            pageInfo: {
              hasNextPage: true,
              endCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
              hasPreviousPage: false,
              startCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
              __typename: 'PageInfo',
            },
            __typename: 'DomainsConnection',
          },
        },
      },
    },
  ]

  describe('given a list of domains', () => {
    it('displays a list of domains', async () => {
      const { queryByText } = render(
        <UserStateProvider
          initialState={{ userName: null, jwt: null, tfa: null }}
        >
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/domains']} initialIndex={0}>
                <MockedProvider mocks={mocks} cache={createCache()}>
                  <DomainsPage domainsPerPage={2} />
                </MockedProvider>
              </MemoryRouter>
            </I18nProvider>
          </ThemeProvider>
        </UserStateProvider>,
      )

      await waitFor(() =>
        expect(queryByText(/tbs-sct.gc.ca/i)).toBeInTheDocument(),
      )
    })

    it('filters domains using the search field', async () => {
      const { queryByText, getByRole } = render(
        <UserStateProvider
          initialState={{ userName: null, jwt: null, tfa: null }}
        >
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/domains']} initialIndex={0}>
                <MockedProvider mocks={mocks} cache={createCache()}>
                  <DomainsPage domainsPerPage={2} />
                </MockedProvider>
              </MemoryRouter>
            </I18nProvider>
          </ThemeProvider>
        </UserStateProvider>,
      )

      // both domains are visibles
      await waitFor(() => {
        expect(queryByText(/tbs-sct.gc.ca/i)).toBeInTheDocument()
        expect(queryByText(/rcmp-grc.gc.ca/i)).toBeInTheDocument()
      })

      // get search field
      const domain = getByRole('textbox')
      // input URL
      fillIn(domain, {
        with: 'rcmp-grc.gc.ca',
      })
      // expect searched url
      await waitFor(() => {
        expect(queryByText(/tbs-sct.gc.ca/i)).not.toBeInTheDocument()
        expect(queryByText(/rcmp-grc.gc.ca/i)).toBeInTheDocument()
      })
    })
  })
})
