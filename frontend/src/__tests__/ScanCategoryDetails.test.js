import React from 'react'
import { theme, Accordion, ChakraProvider } from '@chakra-ui/react'
import { MemoryRouter } from 'react-router-dom'
import { render, waitFor } from '@testing-library/react'
import ScanCategoryDetails from '../ScanCategoryDetails'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserVarProvider } from '../UserState'
import { rawDmarcGuidancePageData } from '../fixtures/dmarcGuidancePageData'
import { MockedProvider } from '@apollo/client/testing'
import { makeVar } from '@apollo/client'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

const categoryName = 'https'
const categoryData = rawDmarcGuidancePageData.findDomainByDomain.web.https

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
  })),
})

describe('<ScanCategoryDetails />', () => {
  it('renders', async () => {
    const { getAllByText } = render(
      <MockedProvider>
        <UserVarProvider
          userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}
        >
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/']} initialIndex={0}>
                <Accordion>
                  <ScanCategoryDetails
                    categoryName={categoryName}
                    categoryData={categoryData}
                  />
                </Accordion>
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )
    await waitFor(() => getAllByText(/HTTPS/i))
  })
})
