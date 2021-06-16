import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { theme, ThemeProvider } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { DomainList } from '../DomainList'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

describe('<DomainList />', () => {
  it('executes a child function once for each passed domain', async () => {
    const domains = [
      {
        node: {
          organization: { acronym: 'GC' },
          url: 'canada.ca',
        },
      },
    ]
    const { getByTestId } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <DomainList domains={domains}>
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
    const { getByText } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <DomainList domains={[]} data-testid="list">
            {({ node }) => <p key={node.url}>{node.url}</p>}
          </DomainList>
        </I18nProvider>
      </ThemeProvider>,
    )

    await waitFor(() => {
      const nope = getByText(/No Domains/i)
      expect(nope).toBeInTheDocument()
    })
  })

  it('gracefully handles null', async () => {
    const { getByText } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <DomainList domains={null} data-testid="list">
            {({ node }) => <p key={node.url}>{node.url}</p>}
          </DomainList>
        </I18nProvider>
      </ThemeProvider>,
    )

    await waitFor(() => {
      const nope = getByText(/No Domains/i)
      expect(nope).toBeInTheDocument()
    })
  })
})
