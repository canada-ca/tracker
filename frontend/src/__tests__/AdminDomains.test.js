import React from 'react'
import { waitFor, render } from '@testing-library/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '@lingui/react'
import { UserStateProvider } from '../UserState'
import { setupI18n } from '@lingui/core'
import { AdminDomains } from '../AdminDomains'

describe('<AdminDomains />', () => {
  it('successfully renders with mocked data', async () => {
    const mocks = {
      domains: {
        edges: [
          {
            node: {
              url: 'canada.ca',
              slug: 'org-slug-test',
              lastRan: null,
            },
          },
        ],
        pageInfo: {
          hasNextPage: false,
        },
      },
    }

    const { getAllByText } = render(
      <UserStateProvider
        initialState={{
          userName: 'testuser@testemail.gc.ca',
          jwt: 'string',
          tfa: false,
        }}
      >
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={setupI18n()}>
            <MemoryRouter initialEntries={['/']}>
              <AdminDomains domainsData={mocks} />
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>
      </UserStateProvider>,
    )

    await waitFor(() => {
      const domains = getAllByText('canada.ca')
      expect(domains).toHaveLength(1)
    })
  })

  it(`gracefully handles a "no results" empty list`, async () => {
    const { getByText } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={setupI18n()}>
          <AdminDomains domainsData={null} />
        </I18nProvider>
      </ThemeProvider>,
    )

    await waitFor(() => {
      const nope = getByText(/No Domains/i)
      expect(nope).toBeInTheDocument()
    })
  })
})
