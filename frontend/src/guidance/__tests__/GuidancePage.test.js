import React from 'react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { render, waitFor, fireEvent } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import matchMediaPolyfill from 'mq-polyfill'
import { makeVar } from '@apollo/client'
import { en } from 'make-plural/plurals'

import GuidancePage from '../GuidancePage'

import { UserVarProvider } from '../../utilities/userState'
import { rawDmarcGuidancePageData, rawDomainGuidancePageDataNoAffiliations } from '../../fixtures/dmarcGuidancePageData'
import { DOMAIN_GUIDANCE_PAGE } from '../../graphql/queries'
import { REQUEST_INVITE_TO_ORG } from '../../graphql/mutations'

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
      query: DOMAIN_GUIDANCE_PAGE,
      variables: { domain: 'forces.gc.ca' },
    },
    result: {
      data: rawDmarcGuidancePageData.data,
    },
  },
  {
    request: {
      query: DOMAIN_GUIDANCE_PAGE,
      variables: { domain: 'noaffiliations.gc.ca' },
    },
    result: {
      data: rawDomainGuidancePageDataNoAffiliations.data,
    },
  },
  {
    request: {
      query: REQUEST_INVITE_TO_ORG,
      variables: {
        orgId: rawDomainGuidancePageDataNoAffiliations.data.findDomainByDomain.organizations.edges[1].node.id,
      },
    },
    result: {
      data: {
        requestOrgAffiliation: {
          result: {
            status: 'Successfully requested invite to organization, and sent notification email.',
            __typename: 'InviteUserToOrgResult',
          },
          __typename: 'RequestOrgAffiliationPayload',
        },
      },
    },
  },
]

describe('<GuidancePage />', () => {
  it('uses the a domainSlug param to fetch data', async () => {
    window.resizeTo(1024, 768)
    const { getByText } = render(
      <MockedProvider mocks={mocks}>
        <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/domains/forces.gc.ca/web-guidance']} initialIndex={0}>
                <Route path="/domains/:domainSlug/:activeTab?">
                  <GuidancePage />
                </Route>
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )

    await waitFor(() => {
      expect(getByText(/amie.info/i)).toBeInTheDocument()
    })
  })

  it('renders the loading message when the data is loading', async () => {
    window.resizeTo(1024, 768)
    const { getByText } = render(
      <MockedProvider mocks={mocks}>
        <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/domains/forces.gc.ca']} initialIndex={0}>
                <Route path="/domains/:domainSlug">
                  <GuidancePage />
                </Route>
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )

    expect(getByText(/Guidance results/i)).toBeInTheDocument()
  })

  it('renders the user does not have permissions message when the user does not have permission', async () => {
    window.resizeTo(1024, 768)
    const { getByText, getAllByRole, getByRole } = render(
      <MockedProvider mocks={mocks}>
        <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: 'user' })}>
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/domains/noaffiliations.gc.ca/web-guidance']} initialIndex={0}>
                <Route path="/domains/:domainSlug/:activeTab?">
                  <GuidancePage />
                </Route>
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )

    await waitFor(() => {
      expect(getByText(/Error while retrieving scan data/)).toBeInTheDocument()
    })
    expect(getByText('Test 2')).toBeInTheDocument()
    const requestAccessButtons = getAllByRole('button', { name: /Request Invite/ })
    const test2RequestButton = requestAccessButtons[1]
    fireEvent.click(test2RequestButton)
    await waitFor(() => {
      expect(getByText('Would you like to request an invite to Test 2?')).toBeInTheDocument()
    })

    const confirmButton = getByRole('button', { name: /Confirm/ })
    fireEvent.click(confirmButton)
    await waitFor(() => {
      expect(getByText(/Invite Requested/)).toBeInTheDocument()
    })
  })
})
