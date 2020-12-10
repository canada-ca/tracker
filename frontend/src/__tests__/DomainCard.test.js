import React from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, theme } from '@chakra-ui/core'
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

const email = {
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
}

const web = {
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
                web={web}
                email={email}
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
                web={web}
                email={email}
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
