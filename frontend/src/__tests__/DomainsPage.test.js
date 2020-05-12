import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/react-testing'
import { UserStateProvider } from '../UserState'
import DomainsPage from '../DomainsPage'
import { DOMAINS } from '../graphql/queries'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'

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

describe('<DomainsPage>', () => {
  it(`gracefully handles no domains being returned`, async () => {
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
