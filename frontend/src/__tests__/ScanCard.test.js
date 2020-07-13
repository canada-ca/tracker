import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter } from 'react-router-dom'
import { render, waitFor } from '@testing-library/react'
import ScanCard from '../ScanCard'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'
import {rawDmarcGuidancePageData} from '../fixtures/dmarcGuidancePageData'

describe('<ScanCard />', () => {
  it('renders', async () => {
    const { getAllByText } = render(
      <UserStateProvider
        initialState={{ userName: null, jwt: null, tfa: null }}
      >
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={setupI18n()}>
            <MemoryRouter initialEntries={['/']} initialIndex={0}>
                <ScanCard scanType="web" scanData={rawDmarcGuidancePageData.findDomainBySlug.web.edges[0].node}/>
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>
      </UserStateProvider>,
    )
    await waitFor(() => getAllByText(/Web Scan Results/i))
  })
})
