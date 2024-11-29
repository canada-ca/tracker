import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { AdditionalFindings } from '../AdditionalFindings'
import { MockedProvider } from '@apollo/client/testing'
import { UserVarProvider } from '../../utilities/userState'
import { ChakraProvider, theme } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { MemoryRouter } from 'react-router-dom'
import { makeVar } from '@apollo/client'
import { setupI18n } from '@lingui/core'
import { en } from 'make-plural'
import { GUIDANCE_ADDITIONAL_FINDINGS } from '../../graphql/queries'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: { plurals: en },
  },
})

const mocks = [
  {
    request: {
      query: GUIDANCE_ADDITIONAL_FINDINGS,
      variables: {
        domain: 'test.domain',
      },
    },
    result: {
      data: {
        findDomainByDomain: {
          ignoredCves: [],
          additionalFindings: {
            timestamp: '2021-05-24 09:51:49.819Z',
            headers: [],
            locations: [
              {
                city: 'Hello World',
                region: 'Hello World',
                firstSeen: 'Hello World',
                lastSeen: 'Hello World',
              },
            ],
            ports: [
              {
                port: 443,
                lastPortState: 'OPEN',
                portStateFirstSeen: 'Hello World',
                portStateLastSeen: 'Hello World',
              },
            ],
            webComponents: [
              {
                webComponentCategory: 'DDOS Protection',
                webComponentName: 'Hello World',
                webComponentVersion: 'Hello World',
                webComponentFirstSeen: 'Hello World',
                webComponentLastSeen: 'Hello World',
              },
            ],
            vulnerabilities: {
              critical: [
                {
                  cve: 'CVE-2024-12345',
                  cvss3Score: 9.3,
                },
              ],
              high: [],
              medium: [
                {
                  cve: 'CVE-2021-12345',
                  cvss3Score: 5.3,
                },
              ],
              low: [],
            },
          },
        },
      },
    },
  },
]

describe('<AdditonalFindings />', () => {
  it('renders AdditionalFindings without crashing', () => {
    render(
      <MockedProvider mocks={mocks}>
        <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/domains/forces.gc.ca']} initialIndex={0}>
                <AdditionalFindings domain="test.domain" />
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )
  })

  it('renders correct number of AccordionItem components', async () => {
    const { getByText, getAllByRole } = render(
      <MockedProvider mocks={mocks}>
        <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/domains/forces.gc.ca']} initialIndex={0}>
                <AdditionalFindings domain="test.domain" />
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )

    await waitFor(() => {
      expect(getByText(/Last Scanned/i)).toBeInTheDocument()
    })

    const accordionItems = getAllByRole('button', { expanded: true })
    expect(accordionItems).toHaveLength(7)
  })
})
