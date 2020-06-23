import React from 'react'
import { GraphQLError } from 'graphql'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/react-testing'
import { MemoryRouter } from 'react-router-dom'
import { UserStateProvider } from '../UserState'
import DomainsPage from '../DomainsPage'
import { DOMAINS } from '../graphql/queries'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'

describe('<DomainsPage>', () => {
  it('notifies the user of errors', async () => {
    const invalidTokenMessage = 'Invalid token, please login again'
    const mocks = [
      {
        request: {
          query: DOMAINS,
        },
        result: {
          data: { domains: null },
          errors: [new GraphQLError(invalidTokenMessage)],
        },
      },
    ]
    const { queryByText } = render(
      <UserStateProvider
        initialState={{ userName: 'me', jwt: 'longstring', tfa: null }}
      >
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={setupI18n()}>
            <MemoryRouter initialEntries={['/']} initialIndex={0}>
              <MockedProvider mocks={mocks}>
                <DomainsPage />
              </MockedProvider>
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>
      </UserStateProvider>,
    )

    // await waitFor(() => {
    //   const errorMessage = queryByText(invalidTokenMessage)
    //   expect(errorMessage).toBeInTheDocument()
    // })
  })

  it('notifies the user of errors', async () => {
    const invalidTokenMessage = 'Invalid token, please login again'
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
    const { queryByText } = render(
      <UserStateProvider
        initialState={{ userName: 'me', jwt: 'longstring', tfa: null }}
      >
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={setupI18n()}>
            <MemoryRouter initialEntries={['/']} initialIndex={0}>
              <MockedProvider mocks={mocks} addTypename={false}>
                <DomainsPage />
              </MockedProvider>
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>
      </UserStateProvider>,
    )

    // await waitFor(() => {
    //   const errorMessage = queryByText(invalidTokenMessage)
    //   expect(errorMessage).toBeInTheDocument()
    // })
  })
})
