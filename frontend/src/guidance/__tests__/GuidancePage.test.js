import React from 'react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { render, waitFor, fireEvent, screen } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { I18nProvider } from '@lingui/react'
import { i18n } from '@lingui/core'
import matchMediaPolyfill from 'mq-polyfill'
import { makeVar } from '@apollo/client'
import GuidancePage from '../GuidancePage'
import { UserVarProvider } from '../../utilities/userState'
import { rawDmarcGuidancePageData, rawDomainGuidancePageDataNoAffiliations } from '../../fixtures/dmarcGuidancePageData'
import { DOMAIN_ADDITIONAL_FINDINGS, DOMAIN_GUIDANCE_PAGE } from '../../graphql/queries'
import { REQUEST_INVITE_TO_ORG } from '../../graphql/mutations'
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
      query: DOMAIN_ADDITIONAL_FINDINGS,
      variables: { domain: 'forces.gc.ca', first: 10, orderBy: { field: 'LAST_SEEN', direction: 'DESC' } },
    },
    result: {
      data: {
        findDomainByDomain: {
          __typename: 'Domain',
          id: rawDmarcGuidancePageData.data.findDomainByDomain.id,
          additionalFindings: {
            __typename: 'AdditionalFindingConnection',
            totalCount: 1,
            pageInfo: {
              __typename: 'PageInfo',
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: 'cursor-1',
              endCursor: 'cursor-1',
            },
            edges: [
              {
                __typename: 'AdditionalFindingEdge',
                cursor: 'cursor-1',
                node: {
                  __typename: 'AdditionalFinding',
                  id: 'finding-1',
                  source: 'subdomain-takeover',
                  subject: 'old.forces.gc.ca',
                  findingType: 'subdomain-takeover-cname',
                  confidence: 'probable',
                  reasonCode: 'NXDOMAIN_TARGET',
                  firstSeen: '2024-01-01T00:00:00.000Z',
                  lastSeen: '2024-01-02T00:00:00.000Z',
                  evidence: { recordType: 'CNAME', target: 'ghost.example.net' },
                  attributes: {},
                },
              },
            ],
          },
        },
      },
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

const router = createMemoryRouter(
  [
    {
      path: '/domains/:domainSlug/:activeTab?',
      element: <GuidancePage />,
    },
  ],
  {
    initialEntries: ['/domains/forces.gc.ca/web-guidance'],
    initialIndex: 0,
  },
)

describe('<GuidancePage />', () => {
  it('uses the a domainSlug param to fetch data', async () => {
    window.resizeTo(1024, 768)
    const { getByText } = render(
      <MockedProvider mocks={mocks}>
        <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <RouterProvider router={router}>
                <GuidancePage />
              </RouterProvider>
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
              <RouterProvider router={router}>
                <GuidancePage />
              </RouterProvider>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )

    expect(getByText(/Guidance results/i)).toBeInTheDocument()
  })

  it('renders the user does not have permissions message when the user does not have permission', async () => {
    window.resizeTo(1024, 768)
    const router = createMemoryRouter(
      [
        {
          path: '/domains/:domainSlug/:activeTab?',
          element: <GuidancePage />,
        },
      ],
      {
        initialEntries: ['/domains/noaffiliations.gc.ca/web-guidance'],
        initialIndex: 0,
      },
    )
    const { getByText, getAllByRole, getByRole } = render(
      <MockedProvider mocks={mocks}>
        <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: 'user' })}>
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <RouterProvider router={router}>
                <GuidancePage />
              </RouterProvider>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )

    await waitFor(() => {
      expect(getByText(/Unable to retrieve scan data for/)).toBeInTheDocument()
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
  describe('additional findings tab', () => {
    const renderAt = (path) => {
      window.resizeTo(1024, 768)
      const testRouter = createMemoryRouter([{ path: '/domains/:domainSlug/:activeTab?', element: <GuidancePage /> }], {
        initialEntries: [path],
        initialIndex: 0,
      })
      render(
        <MockedProvider mocks={mocks}>
          <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
            <ChakraProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <RouterProvider router={testRouter} />
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )
      return testRouter
    }

    it('renders Web Guidance, Email Guidance and Additional Findings tabs', async () => {
      renderAt('/domains/forces.gc.ca/web-guidance')

      expect(await screen.findByRole('tab', { name: 'Web Guidance' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Email Guidance' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Additional Findings' })).toBeInTheDocument()
    })

    it('navigates to the additional-findings route and renders the findings list when the tab is selected', async () => {
      const testRouter = renderAt('/domains/forces.gc.ca/web-guidance')

      fireEvent.click(await screen.findByRole('tab', { name: 'Additional Findings' }))

      await waitFor(() => expect(testRouter.state.location.pathname).toBe('/domains/forces.gc.ca/additional-findings'))
      expect(
        await screen.findByText(/old\.forces\.gc\.ca is a CNAME pointing to ghost\.example\.net/),
      ).toBeInTheDocument()
      expect(screen.getByText('Dangling CNAME')).toBeInTheDocument()
    })

    it('opens directly on the findings tab when the route names it', async () => {
      renderAt('/domains/forces.gc.ca/additional-findings')

      expect(await screen.findByText(/old\.forces\.gc\.ca is a CNAME/)).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Additional Findings' })).toHaveAttribute('aria-selected', 'true')
    })

    it('shows the DNS error message on web and email tabs but still serves findings when the rcode is not NOERROR', async () => {
      // the forces.gc.ca fixture has rcode "Hello World"
      const testRouter = renderAt('/domains/forces.gc.ca/web-guidance')

      expect(
        await screen.findByText(/A DNS request for this service has resulted in the following error code/),
      ).toBeInTheDocument()
      expect(screen.getByText('Hello World')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('tab', { name: 'Email Guidance' }))
      expect(
        await screen.findByText(/A DNS request for this service has resulted in the following error code/),
      ).toBeInTheDocument()

      fireEvent.click(screen.getByRole('tab', { name: 'Additional Findings' }))
      expect(await screen.findByText(/old\.forces\.gc\.ca is a CNAME/)).toBeInTheDocument()
      expect(
        screen.queryByText(/A DNS request for this service has resulted in the following error code/),
      ).not.toBeInTheDocument()
      expect(testRouter.state.location.pathname).toBe('/domains/forces.gc.ca/additional-findings')
    })
  })
})
