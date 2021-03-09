import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter } from 'react-router-dom'
import { render, waitFor } from '@testing-library/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'
import { rawEmailGuidancePageData } from '../fixtures/dmarcGuidancePageData'
import { GuidanceTagList } from '../GuidanceTagList'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

const selectorNode =
  rawEmailGuidancePageData.findDomainByDomain.email.dkim.edges[0].node.results
    .edges[0].node
const negativeTags = selectorNode.negativeGuidanceTags.edges
const neutralTags = selectorNode.neutralGuidanceTags.edges
const positiveTags = selectorNode.positiveGuidanceTags.edges
const selector = selectorNode.selector
const categoryName = 'dkim'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
  })),
})

describe('<GuidanceTagList />', () => {
  it('renders', async () => {
    const { getAllByText } = render(
      <UserStateProvider
        initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
      >
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <MemoryRouter initialEntries={['/']} initialIndex={0}>
              <GuidanceTagList
                negativeTags={negativeTags}
                neutralTags={neutralTags}
                positiveTags={positiveTags}
                selector={selector}
                categoryName={categoryName}
              />
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>
      </UserStateProvider>,
    )
    await waitFor(() => getAllByText(/DKIM record missing but MX uses O365/i))
  })
})
