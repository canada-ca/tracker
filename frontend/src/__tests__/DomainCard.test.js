import React from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { theme, ThemeProvider } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { MockedProvider } from '@apollo/client/testing'
import { setupI18n } from '@lingui/core'
import { DomainCard } from '../DomainCard'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})
const status = {
  dkim: 'PASS',
  dmarc: 'PASS',
  https: 'PASS',
  spf: 'PASS',
  ssl: 'PASS',
}

describe('<OrganizationsCard />', () => {
  it('successfully renders card with domain name and date of last scan', async () => {
    const { getByText } = render(
      <MockedProvider>
        <MemoryRouter initialEntries={['/']}>
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <DomainCard
                url="tbs-sct.gc.ca"
                lastRan="2020-09-10T00:34:26.429Z"
                status={status}
                hasDMARCReport={true}
              />
            </I18nProvider>
          </ThemeProvider>
        </MemoryRouter>
      </MockedProvider>,
    )

    const domain = getByText(/tbs-sct.gc.ca/i)
    expect(domain).toBeDefined()
    const lastRan = getByText(/2020-09-10T00:34/i)
    expect(lastRan).toBeDefined()
  })

  it('presents appropriate message when no scan date is found', async () => {
    const { getByText } = render(
      <MockedProvider>
        <MemoryRouter initialEntries={['/']}>
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <DomainCard
                url="tbs-sct.gc.ca"
                lastRan={null}
                status={status}
                hasDMARCReport={true}
              />
            </I18nProvider>
          </ThemeProvider>
        </MemoryRouter>
      </MockedProvider>,
    )

    const domain = getByText(/tbs-sct.gc.ca/i)
    expect(domain).toBeDefined()
    const lastRan = getByText(/Not scanned yet./i)
    expect(lastRan).toBeDefined()
  })
})
