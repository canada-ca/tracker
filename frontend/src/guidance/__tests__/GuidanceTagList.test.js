import React from 'react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { MemoryRouter } from 'react-router-dom'
import { render, waitFor } from '@testing-library/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { MockedProvider } from '@apollo/client/testing'
import { makeVar } from '@apollo/client'
import { en } from 'make-plural/plurals'

import { GuidanceTagList } from '../GuidanceTagList'

import { UserVarProvider } from '../../utilities/userState'
import { rawDmarcGuidancePageData } from '../../fixtures/dmarcGuidancePageData'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: { plurals: en },
  },
})

const spfResult =
  rawDmarcGuidancePageData.data.findDomainByDomain.dnsScan.edges[0].node.spf
const negativeTags = spfResult.negativeTags
const neutralTags = spfResult.neutralTags
const positiveTags = spfResult.positiveTags

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
  })),
})

describe('<GuidanceTagList />', () => {
  it('renders guidance tags', async () => {
    const { getAllByText } = render(
      <MockedProvider>
        <UserVarProvider
          userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}
        >
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/']} initialIndex={0}>
                <GuidanceTagList
                  negativeTags={negativeTags}
                  neutralTags={neutralTags}
                  positiveTags={positiveTags}
                  selector="selector"
                />
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )
    await waitFor(() =>
      getAllByText(/SPF record is properly formed/i),
    )
    await waitFor(() =>
      getAllByText(/Record terminated with "-all"/i),
    )
  })
})
