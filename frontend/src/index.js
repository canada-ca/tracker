import React from 'react'
import { ThemeProvider } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { ApolloProvider } from '@apollo/react-hooks'
import { i18n } from '@lingui/core'
import ReactDOM from 'react-dom'
import App from './App'
import * as serviceWorker from './serviceWorker'
import { BrowserRouter as Router } from 'react-router-dom'
import canada from './theme/canada'
import { createHttpLink } from 'apollo-link-http'
import ApolloClient from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import fetch from 'isomorphic-unfetch'

const client = new ApolloClient({
  link: createHttpLink({ uri: process.env.GRAPHQL_ENDPOINT, fetch }),
  cache: new InMemoryCache(),
})

ReactDOM.render(
  <ApolloProvider client={client}>
    <ThemeProvider theme={canada}>
      <I18nProvider i18n={i18n}>
        <Router>
          <App />
        </Router>
      </I18nProvider>
    </ThemeProvider>
  </ApolloProvider>,
  document.getElementById('root'),
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
