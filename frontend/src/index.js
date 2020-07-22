import React from 'react'
import { ThemeProvider } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { ApolloProvider } from '@apollo/client'
import { i18n } from '@lingui/core'
import ReactDOM from 'react-dom'
import App from './App'
import * as serviceWorker from './serviceWorker'
import { BrowserRouter as Router } from 'react-router-dom'
import canada from './theme/canada'
import { Client } from './client'
import { UserStateProvider } from './UserState'

const client = new Client()

ReactDOM.render(
  <UserStateProvider initialState={{ userName: null, jwt: null, tfa: null }}>
    <ApolloProvider client={client}>
      <ThemeProvider theme={canada}>
        <I18nProvider i18n={i18n}>
          <Router>
            <App />
          </Router>
        </I18nProvider>
      </ThemeProvider>
    </ApolloProvider>
  </UserStateProvider>,
  document.getElementById('root'),
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
