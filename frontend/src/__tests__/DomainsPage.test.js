import React from 'react'
import { GraphQLError } from 'graphql'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/react-testing'
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
            <MockedProvider mocks={mocks}>
              <DomainsPage />
            </MockedProvider>
          </I18nProvider>
        </ThemeProvider>
      </UserStateProvider>,
    )

    await waitFor(() => {
      const errorMessage = queryByText(invalidTokenMessage)
      expect(errorMessage).toBeInTheDocument()
    })
  })

  it(`gracefully handles no domains being returned`, async () => {
    const mocks = [
      {
        request: {
          query: DOMAINS,
        },
        result: {
          data: {
            domains: {
              edges: [{ node: null, __typename: 'DomainEdge' }],
              __typename: 'DomainConnection',
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
            <MockedProvider mocks={mocks}>
              <DomainsPage />
            </MockedProvider>
          </I18nProvider>
        </ThemeProvider>
      </UserStateProvider>,
    )

    await waitFor(() => {
      const domains = queryByText(/no domains scanned/i)
      expect(domains).toBeInTheDocument()
    })
  })
})
