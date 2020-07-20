import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { UserStateProvider } from '../UserState'
import DomainsPage from '../DomainsPage'
import { DOMAINS } from '../graphql/queries'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { MockedProvider } from '@apollo/client/testing'
// TODO: remove this after DomainsPage is refactored away from it's reliance on
// useEffect. This is a bandaid that is papering over test errors.
import { mockLink } from '../mockLink'

describe('<DomainsPage>', () => {
  it('notifies the user of errors', async () => {
    const invalidTokenMessage = 'Invalid token, please login again'
    const mocks = [
      {
        request: {
          query: DOMAINS,
          variables: {},
        },
        result: {
          errors: [{ message: invalidTokenMessage }],
        },
      },
    ]
    const { getByText } = render(
      <UserStateProvider
        initialState={{ userName: 'me', jwt: 'longstring', tfa: null }}
      >
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={setupI18n()}>
            <MemoryRouter initialEntries={['/']} initialIndex={0}>
              <MockedProvider addTypename={false} link={mockLink(mocks)}>
                <DomainsPage />
              </MockedProvider>
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>
      </UserStateProvider>,
    )

    await waitFor(() => {
      const errorMessage = getByText(invalidTokenMessage)
      expect(errorMessage).toBeInTheDocument()
    })
  })

  it('displays the domains', async () => {
    const mocks = [
      {
        request: {
          query: DOMAINS,
          variables: {},
        },
        result: {
          data: {
            domains: {
              edges: [
                {
                  node: {
                    url: 'tbs-sct.gc.ca',
                    slug: 'tbs-sct-gc-ca',
                    lastRan: null,
                  },
                },
                {
                  node: {
                    url: 'canada.ca',
                    slug: 'canada-ca',
                    lastRan: null,
                  },
                },
                {
                  node: {
                    url: 'rcmp-grc.gc.ca',
                    slug: 'rcmp-grc-gc-ca',
                    lastRan: null,
                  },
                },
              ],
              pageInfo: {
                endCursor: 'YXJyYXljb25uZWN0aW9uOjI=',
                hasNextPage: false,
              },
            },
          },
        },
      },
    ]
    const { getByText } = render(
      <UserStateProvider
        initialState={{ userName: 'me', jwt: 'longstring', tfa: null }}
      >
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={setupI18n()}>
            <MemoryRouter initialEntries={['/']} initialIndex={0}>
              <MockedProvider link={mockLink(mocks)} addTypename={false}>
                <DomainsPage />
              </MockedProvider>
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>
      </UserStateProvider>,
    )

    await waitFor(() => {
      expect(getByText(/tbs-sct.gc.ca/)).toBeInTheDocument()
    })
  })
})
