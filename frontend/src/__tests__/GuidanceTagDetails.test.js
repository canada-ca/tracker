import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter } from 'react-router-dom'
import { render, waitFor } from '@testing-library/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'
import { rawEmailGuidancePageData } from '../fixtures/dmarcGuidancePageData'
import { GuidanceTagDetails } from '../GuidanceTagDetails'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

const guidanceTag =
  rawEmailGuidancePageData.findDomainByDomain.email.dmarc.edges[0].node
    .negativeGuidanceTags.edges[0].node

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
  })),
})

describe('<GuidanceTagDetails />', () => {
  it('renders', async () => {
    const { getAllByText } = render(
      <UserStateProvider
        initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
      >
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <MemoryRouter initialEntries={['/']} initialIndex={0}>
              <GuidanceTagDetails guidanceTag={guidanceTag} />
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>
      </UserStateProvider>,
    )
    await waitFor(() =>
      getAllByText(/A.3.4 Deploy DKIM for All Domains and senders/i),
    )
  })
})
