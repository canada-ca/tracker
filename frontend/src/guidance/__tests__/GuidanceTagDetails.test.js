import React from 'react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { MemoryRouter } from 'react-router-dom'
import { render, waitFor } from '@testing-library/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { MockedProvider } from '@apollo/client/testing'
import { makeVar } from '@apollo/client'

import { GuidanceTagDetails } from '../GuidanceTagDetails'

import { UserVarProvider } from '../../utilities/userState'
import { rawDmarcGuidancePageData } from '../../fixtures/dmarcGuidancePageData'

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
  rawDmarcGuidancePageData.findDomainByDomain.email.dmarc.edges[0].node
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
      <MockedProvider>
        <UserVarProvider
          userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}
        >
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/']} initialIndex={0}>
                <GuidanceTagDetails guidanceTag={guidanceTag} />
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )
    await waitFor(() => getAllByText(/DKIM-missing/i))
  })
})
