import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter } from 'react-router-dom'
import { render, waitFor } from '@testing-library/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'
import {rawDmarcGuidancePageData} from '../fixtures/dmarcGuidancePageData'
import { GuidanceTagList } from '../GuidanceTagList'

const selectorNode = rawDmarcGuidancePageData.findDomainBySlug.email.edges[0].node.dkim.selectors[0]
const guidanceTags = selectorNode.dkimGuidanceTags
const selector = selectorNode.selector
const categoryName = "dkim"

describe('<GuidanceTagList />', () => {
  it('renders', async () => {
    const { getAllByText } = render(
      <UserStateProvider
        initialState={{ userName: null, jwt: null, tfa: null }}
      >
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={setupI18n()}>
            <MemoryRouter initialEntries={['/']} initialIndex={0}>
                <GuidanceTagList guidanceTags={guidanceTags} selector={selector} categoryName={categoryName}/>
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>
      </UserStateProvider>,
    )
    await waitFor(() => getAllByText(/selector/i))
  })
})
