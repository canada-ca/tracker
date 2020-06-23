import React from 'react'
import { waitFor, render } from '@testing-library/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '@lingui/react'
import { UserStateProvider } from '../UserState'
import { setupI18n } from '@lingui/core'
import { DomainList } from '../DomainList'
import { it } from 'make-plural'

describe('<DomainList />', () => {
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
              <DomainList domainsdata={mocks} />
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

  it('executes a child function once for each passed domain', async () => {
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

    const { getByTestId } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={setupI18n()}>
          <DomainList domainsdata={mocks}>
            {({ node }) => (
              <p data-testid="domain" key={node.url}>
                {node.url}
              </p>
            )}
          </DomainList>
        </I18nProvider>
      </ThemeProvider>,
    )

    await waitFor(() => {
      const domain = getByTestId('domain')
      expect(domain.innerHTML).toEqual('canada.ca')
    })
  })

  it(`gracefully handles a "no results" empty list`, async () => {
    const mocks = {
      domains: {
        edges: [],
        pageInfo: {
          hasNextPage: false,
        },
      },
    }

    const { getByText } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={setupI18n()}>
          <DomainList domainsdata={mocks}>
            {({ node }) => <p key={node.url}>{node.url}</p>}
          </DomainList>
        </I18nProvider>
      </ThemeProvider>,
    )

    await waitFor(() => {
      const nope = getByText(/No domains/i)
      expect(nope).toBeInTheDocument()
    })
  })
})
