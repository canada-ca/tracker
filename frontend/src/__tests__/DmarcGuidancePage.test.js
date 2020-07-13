import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter } from 'react-router-dom'
import { render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/react-testing'
import {DmarcGuidancePage} from '../DmarcGuidancePage'
import {  GET_GUIDANCE_TAGS_OF_DOMAIN } from '../graphql/queries'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'
import {rawDmarcGuidancePageData} from '../fixtures/dmarcGuidancePageData'

const mocks = [
  {
    request: {
      query: GET_GUIDANCE_TAGS_OF_DOMAIN,
    },
    result: {
      data: rawDmarcGuidancePageData,
    },
  },
]

describe('<DmarcGuidancePage />', () => {
  it('renders', async () => {
    const { getAllByText } = render(
      <UserStateProvider
        initialState={{ userName: null, jwt: null, tfa: null }}
      >
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={setupI18n()}>
            <MemoryRouter initialEntries={['/']} initialIndex={0}>
              <MockedProvider mocks={mocks} addTypename={false}>
                <DmarcGuidancePage />
              </MockedProvider>
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>
      </UserStateProvider>,
    )
    await waitFor(() => getAllByText(/Web Scan Results/i))
  })
})
