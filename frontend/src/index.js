import React, { useEffect } from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import ReactDOM from 'react-dom'
import App from './App'
import * as serviceWorker from './serviceWorker'
import {
  BrowserRouter as Router,
  useHistory,
  useLocation,
} from 'react-router-dom'
import canada from './theme/canada'
import { client, currentUserVar } from './client'
import { ApolloProvider, useMutation } from '@apollo/client'
import { UserVarProvider, useUserVar } from './UserState'
import { I18nProvider } from '@lingui/react'
import { i18n } from '@lingui/core'
import { REFRESH_TOKENS } from './graphql/mutations'
import { activate } from './i18n.config'

const I18nApp = () => {
  const { currentUser, login } = useUserVar()
  const location = useLocation()
  const { from } = location.state || { from: { pathname: '/' } }
  const history = useHistory()

  const [refreshTokens] = useMutation(REFRESH_TOKENS, {
    onError(error) {
      console.error(error.message)
    },
    onCompleted({ refreshTokens }) {
      if (refreshTokens.result.__typename === 'AuthResult') {
        if (!currentUser.jwt) {
          // User not logged in yet, set up environment (redirect and lang)
          if (refreshTokens.result.user.preferredLang === 'ENGLISH')
            activate('en')
          else if (refreshTokens.result.user.preferredLang === 'FRENCH')
            activate('fr')
        }
        login({
          jwt: refreshTokens.result.authToken,
          tfaSendMethod: refreshTokens.result.user.tfaSendMethod,
          userName: refreshTokens.result.user.userName,
        })
        if (from.pathname !== '/') history.replace(from)
      }
      // Non server error occurs
      else if (refreshTokens.result.__typename === 'AuthenticateError') {
        // Could not authenticate
      } else {
        console.warn('Incorrect authenticate.result typename.')
      }
    },
  })

  useEffect(() => {
    if (currentUser?.jwt) {
      const jwtPayload = currentUser.jwt.split('.')[1]
      const payloadDecoded = window.atob(jwtPayload)
      const jwtExpiryTimeSeconds = JSON.parse(payloadDecoded).exp
      // using seconds as that's what the api uses
      const currentTimeSeconds = Math.floor(new Date().getTime() / 1000)
      const jwtExpiresAfterSeconds = jwtExpiryTimeSeconds - currentTimeSeconds
      const timeoutID = setTimeout(() => {
        refreshTokens()
      }, (jwtExpiresAfterSeconds - 60) * 1000)
      return () => {
        clearTimeout(timeoutID)
      }
    } else {
      refreshTokens()
    }
  }, [currentUser, refreshTokens])

  return (
    <I18nProvider i18n={i18n}>
      <App />
    </I18nProvider>
  )
}

ReactDOM.render(
  <ApolloProvider client={client}>
    <UserVarProvider userVar={currentUserVar}>
      <ChakraProvider theme={canada}>
        <Router>
          <I18nApp />
        </Router>
      </ChakraProvider>
    </UserVarProvider>
  </ApolloProvider>,
  document.getElementById('root'),
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
