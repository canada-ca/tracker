import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, waitFor, screen } from '@testing-library/react'
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
            <I18nProvider i18n={setupI18n()}>
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
  })
  describe('given the domain scan page', () => {
    it('successfully submits a domain for scanning', async () => {
      const values = { domain: 'cse-cst.gc.ca' }

      const { container, getByRole, getByText, queryByText } = render(
        <UserStateProvider
          initialState={{ userName: null, jwt: null, tfa: null }}
        >
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={setupI18n()}>
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
      fireEvent.click(getByText('Scan'))

      const domain = container.querySelector('#domain')
      const form = getByRole('form')

      fireEvent.change(domain, {
        target: {
          value: values.domain,
        },
      })

      fireEvent.submit(form)

      /* add in when mutation is hooked up */
      // await waitFor(() => {
      // expect(queryByText(values.domain)).toBeInTheDocument()
      // })
    })
  })
})
