import React from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { List, theme, ChakraProvider } from '@chakra-ui/react'
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
  policy: 'pass',
  ciphers: 'pass',
  curves: 'pass',
  dkim: 'pass',
  dmarc: 'pass',
  hsts: 'pass',
  https: 'pass',
  protocols: 'pass',
  spf: 'pass',
  ssl: 'pass',
}

describe('<OrganizationsCard />', () => {
  it('successfully renders card with domain name', async () => {
    const { getByText } = render(
      <MockedProvider>
        <MemoryRouter initialEntries={['/']}>
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <List>
                <DomainCard
                  url="tbs-sct.gc.ca"
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
  })
})
