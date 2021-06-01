import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter } from 'react-router-dom'
import { render, waitFor } from '@testing-library/react'
import ScanCard from '../ScanCard'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'
import { rawDmarcGuidancePageData } from '../fixtures/dmarcGuidancePageData'
import { ApolloProvider } from '@apollo/client'
import { client } from '../client'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

const scanType = 'web'
const scanData = rawDmarcGuidancePageData.findDomainByDomain.web
const webStatus = rawDmarcGuidancePageData.findDomainByDomain.status

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
  })),
})

describe('<ScanCard />', () => {
  it('renders', async () => {
    const { getAllByText } = render(
      <ApolloProvider client={client}>
        <UserStateProvider
          initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
        >
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/']} initialIndex={0}>
                <ScanCard
                  scanType={scanType}
                  scanData={scanData}
                  status={webStatus}
                />
              </MemoryRouter>
            </I18nProvider>
          </ThemeProvider>
        </UserStateProvider>
      </ApolloProvider>,
    )
    await waitFor(() => getAllByText(/Web Scan Results/i))
  })
})
