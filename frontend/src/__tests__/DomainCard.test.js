import React from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { List, theme, ChakraProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { MockedProvider } from '@apollo/client/testing'
import { setupI18n } from '@lingui/core'

import { DomainCard } from '../organizationDetails/DomainCard'

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
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <List>
                <DomainCard
                  url="tbs-sct.gc.ca"
                  lastRan="2020-09-10T00:34:26.429Z"
                  status={status}
                  hasDMARCReport={true}
                />
              </List>
            </I18nProvider>
          </ChakraProvider>
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
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <List>
                <DomainCard
                  url="tbs-sct.gc.ca"
                  lastRan={null}
                  status={status}
                  hasDMARCReport={true}
                />
              </List>
            </I18nProvider>
          </ChakraProvider>
        </MemoryRouter>
      </MockedProvider>,
    )

    const domain = getByText(/tbs-sct.gc.ca/i)
    expect(domain).toBeDefined()
    const lastRan = getByText(/Not scanned yet./i)
    expect(lastRan).toBeDefined()
  })
})
