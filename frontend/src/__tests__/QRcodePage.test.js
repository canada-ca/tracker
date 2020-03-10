import React from 'react'
import { QRcodePage } from '../QRcodePage'
import { i18n } from '@lingui/core'
import { render, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import ApolloClient from 'apollo-client'
import { createHttpLink } from 'apollo-link-http'
import fetch from 'isomorphic-unfetch'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { ApolloProvider } from '@apollo/react-hooks'

i18n.load('en', { en: {} })
i18n.activate('en')

describe('<SignInPage />', () => {
  afterEach(cleanup)

  const client = new ApolloClient({
    link: createHttpLink({ fetch }),
    cache: new InMemoryCache(),
  })

  it('successfully renders the component', () => {
    render(
      <ApolloProvider client={client}>
        <MemoryRouter initialEntries={['/']}>
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <QRcodePage />
            </I18nProvider>
          </ThemeProvider>
        </MemoryRouter>
      </ApolloProvider>,
    )
    expect(render).toBeTruthy()
  })
})
