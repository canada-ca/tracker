import React from 'react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import matchMediaPolyfill from 'mq-polyfill'
import { makeVar } from '@apollo/client'
import { en } from 'make-plural/plurals'

import DmarcGuidancePage from '../GuidancePage'

import { UserVarProvider } from '../../utilities/userState'
import { rawDmarcGuidancePageData } from '../../fixtures/dmarcGuidancePageData'
import { GET_GUIDANCE_TAGS_OF_DOMAIN } from '../../graphql/queries'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: { plurals: en },
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
      variables: { domain: 'forces.gc.ca' },
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
      <MockedProvider mocks={mocks}>
        <UserVarProvider
          userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}
        >
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter
                initialEntries={['/domains/forces.gc.ca']}
                initialIndex={0}
              >
                <Route path="/domains/:domainSlug">
                  <DmarcGuidancePage />
                </Route>
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )

    await waitFor(() => {
      expect(getByText(/forces.gc.ca/i)).toBeInTheDocument()
    })
  })
})
