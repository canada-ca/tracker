import React from 'react'
import { render, screen } from '@testing-library/react'
import { AdditionalFindings } from '../AdditionalFindings'
import { MockedProvider } from '@apollo/client/testing'
import { UserVarProvider } from '../../utilities/userState'
import { ChakraProvider, theme } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { MemoryRouter } from 'react-router-dom'
import { makeVar } from '@apollo/client'
import { setupI18n } from '@lingui/core'
import { en } from 'make-plural'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: { plurals: en },
  },
})

const data = {
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
}

describe('<AdditonalFindings />', () => {
  it('renders AdditionalFindings without crashing', () => {
    render(
      <MockedProvider>
        <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/domains/forces.gc.ca']} initialIndex={0}>
                <AdditionalFindings data={data} />
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )
  })

  it('renders correct number of AccordionItem components', () => {
    render(
      <MockedProvider>
        <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/domains/forces.gc.ca']} initialIndex={0}>
                <AdditionalFindings data={data} />
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )
    const accordionItems = screen.getAllByRole('button', { expanded: true })
    expect(accordionItems).toHaveLength(6)
  })
})
