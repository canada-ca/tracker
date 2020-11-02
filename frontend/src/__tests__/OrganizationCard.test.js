import React from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { MockedProvider } from '@apollo/client/testing'
import { setupI18n } from '@lingui/core'
import { OrganizationCard } from '../OrganizationCard'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

describe('<OrganizationsCard />', () => {
  it('successfully renders card with org name and number of services', async () => {
    const { getByText } = render(
      <MockedProvider>
        <MemoryRouter initialEntries={['/']}>
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <OrganizationCard
                slug="tbs-sct-gc-ca"
                name="Treasury Board Secretariat"
                acronym="TBS"
                domainCount={7}
              />
            </I18nProvider>
          </ThemeProvider>
        </MemoryRouter>
      </MockedProvider>,
    )

    const orgName = getByText(/Treasury Board Secretariat/i)
    expect(orgName).toBeDefined()

    const domainCount = getByText(/Services: 7/i)
    expect(domainCount).toBeDefined()
  })
})
