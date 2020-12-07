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

const domains = {
  pageInfo: {
    hasNextPage: false,
    hasPreviousPage: false,
  },
  edges: [
    {
      node: {
        id: 'OTY2NTI4OTY4NA==',
        domain: 'tbs-sct.gc.ca',
        lastRan: '2020-06-18T00:42:12.414Z',
        email: {
          dmarc: {
            edges: [
              {
                node: {
                  timestamp: '2020-02-10T22:00:27.555Z',
                  dmarcPhase: 2,
                  pPolicy: 'missing',
                  spPolicy: 'missing',
                  pct: 60,
                },
              },
            ],
          },
        },
        web: {
          https: {
            edges: [
              {
                node: {
                  timestamp: '2019-12-22T09:18:56.523Z',
                  implementation: 'Bad Hostname',
                  enforced: 'Strict',
                  hsts: 'HSTS Fully Implemented',
                  hstsAge: '21672901',
                  preloaded: 'HSTS Preloaded',
                },
              },
            ],
          },
        },
      },
    },
  ],
}

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
                verified={false}
                domains={domains}
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
