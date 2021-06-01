import React from 'react'
import { theme, ThemeProvider } from '@chakra-ui/core'
import { MemoryRouter, Route } from 'react-router-dom'
import { render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import DmarcGuidancePage from '../DmarcGuidancePage'
import { GET_GUIDANCE_TAGS_OF_DOMAIN } from '../graphql/queries'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'
import { rawDmarcGuidancePageData } from '../fixtures/dmarcGuidancePageData'
import matchMediaPolyfill from 'mq-polyfill'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

matchMediaPolyfill(window)
window
  .matchMedia('(min-width: 920px)') // Create MediaQueryList instance
  .addListener(console.log) // Subscribe to MQ mode changes

/**
 * For dispatching resize event
 * we must implement window.resizeTo in jsdom
 */
window.resizeTo = function resizeTo(width, height) {
  Object.assign(this, {
    innerWidth: width,
    innerHeight: height,
    outerWidth: width,
    outerHeight: height,
  }).dispatchEvent(new this.Event('resize'))
}

const mocks = [
  {
    request: {
      query: GET_GUIDANCE_TAGS_OF_DOMAIN,
      variables: { domain: 'cse-cst.gc.ca' },
    },
    result: {
      data: rawDmarcGuidancePageData,
    },
  },
]

describe('<DmarcGuidancePage />', () => {
  it('uses the a domainSlug param to fetch data', async () => {
    window.resizeTo(1024, 768)
    const { getByText } = render(
      <MockedProvider addTypename={false} mocks={mocks}>
        <UserStateProvider
          initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
        >
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter
                initialEntries={['/domains/cse-cst.gc.ca']}
                initialIndex={0}
              >
                <Route path="/domains/:domainSlug">
                  <DmarcGuidancePage />
                </Route>
              </MemoryRouter>
            </I18nProvider>
          </ThemeProvider>
        </UserStateProvider>
      </MockedProvider>,
    )

    await waitFor(() => {
      expect(getByText(/Web Scan Results/i)).toBeInTheDocument()
    })
  })
})
