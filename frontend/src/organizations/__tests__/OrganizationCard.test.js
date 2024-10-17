import React from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { List, theme, ChakraProvider, ListItem } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { MockedProvider } from '@apollo/client/testing'
import { setupI18n } from '@lingui/core'
import { en } from 'make-plural/plurals'

import { OrganizationCard } from '../OrganizationCard'

import { matchMediaSize } from '../../helpers/matchMedia'

matchMediaSize()

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: { plurals: en },
  },
})

const summaries = {
  mail: {
    total: 23452,
    categories: [
      {
        name: 'pass',
        count: 6577,
        percentage: 23.4,
      },
      {
        name: 'fail',
        count: 7435,
        percentage: 43.5,
      },
    ],
  },
  web: {
    total: 57896,
    categories: [
      {
        name: 'pass',
        count: 6577,
        percentage: 23.4,
      },
      {
        name: 'fail',
        count: 7435,
        percentage: 43.5,
      },
    ],
  },
}

describe('<OrganizationsCard />', () => {
  it('successfully renders card with org name and number of services', async () => {
    const { getByText } = render(
      <MockedProvider>
        <MemoryRouter initialEntries={['/']}>
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <List>
                <ListItem>
                  <OrganizationCard
                    slug="tbs-sct-gc-ca"
                    name="Treasury Board Secretariat"
                    acronym="TBS"
                    domainCount={7}
                    verified={false}
                    summaries={summaries}
                  />
                </ListItem>
              </List>
            </I18nProvider>
          </ChakraProvider>
        </MemoryRouter>
      </MockedProvider>,
    )

    const orgName = getByText(/Treasury Board Secretariat/i)
    expect(orgName).toBeDefined()

    const domainCount = getByText(/Services: 7/i)
    expect(domainCount).toBeDefined()
  })
})