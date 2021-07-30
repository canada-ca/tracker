import React from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { i18n } from '@lingui/core'
import ReactDOM from 'react-dom'
import App from './App'
import * as serviceWorker from './serviceWorker'
import { BrowserRouter as Router } from 'react-router-dom'
import canada from './theme/canada'
import { client, currentUserVar } from './client'
import { ApolloProvider } from '@apollo/client'
import { UserVarProvider } from './UserState'
import { activate, defaultLocale } from './i18n.config'

const setUpApp = async () => {
  await activate(defaultLocale)

  ReactDOM.render(
    <ApolloProvider client={client}>
      <UserVarProvider userVar={currentUserVar}>
        <ChakraProvider theme={canada}>
          <I18nProvider i18n={i18n}>
            <Router>
              <App />
            </Router>
          </I18nProvider>
        </ChakraProvider>
      </UserVarProvider>
    </ApolloProvider>,
    document.getElementById('root'),
  )

  // If you want your app to work offline and load faster, you can change
  // unregister() to register() below. Note this comes with some pitfalls.
  // Learn more about service workers: https://bit.ly/CRA-PWA
  serviceWorker.unregister()
}

setUpApp()
