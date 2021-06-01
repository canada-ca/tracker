import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter } from 'react-router-dom'
import { render, waitFor } from '@testing-library/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'
import { rawDmarcGuidancePageData } from '../fixtures/dmarcGuidancePageData'
import { GuidanceTagList } from '../GuidanceTagList'
import { ApolloProvider } from '@apollo/client'
import { client } from '../client'

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
  rawDmarcGuidancePageData.findDomainByDomain.email.dmarc.edges[0].node
const negativeTags = selectorNode.negativeGuidanceTags.edges
const neutralTags = selectorNode.neutralGuidanceTags.edges
const positiveTags = selectorNode.positiveGuidanceTags.edges
const selector = selectorNode.selector
const categoryName = 'dmarc'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
  })),
})

describe('<GuidanceTagList />', () => {
  it('renders negative guidance tags', async () => {
    const { getAllByText } = render(
      <ApolloProvider client={client}>
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
        </UserStateProvider>
      </ApolloProvider>,
    )
    await waitFor(() => getAllByText(/DKIM-missing/i))
  })
  it('renders neutral guidance tags', async () => {
    const { getAllByText } = render(
      <ApolloProvider client={client}>
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
        </UserStateProvider>
      </ApolloProvider>,
    )
    await waitFor(() =>
      getAllByText(/A.3.4 Deploy DKIM for All Domains and senders/i),
    )
  })
  it('renders positive guidance tags', async () => {
    const { getAllByText } = render(
      <ApolloProvider client={client}>
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
        </UserStateProvider>
      </ApolloProvider>,
    )
    await waitFor(() =>
      getAllByText(/A.3.4 Deploy DKIM for All Domains and senders/i),
    )
  })
})
