import React, { useEffect } from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, useNavigate, useLocation } from 'react-router-dom'
import { ApolloProvider, useMutation, useQuery } from '@apollo/client'
import { I18nProvider } from '@lingui/react'
import { i18n } from '@lingui/core'

import { App } from './app/App'
import * as serviceWorker from './serviceWorker'
import { client, currentUserVar } from './client'
import canada from './theme/canada'
import { UserVarProvider, useUserVar } from './utilities/userState'
import { REFRESH_TOKENS } from './graphql/mutations'
import { activate, defaultLocale } from './utilities/i18n.config'
import { IS_LOGIN_REQUIRED } from './graphql/queries'
import { TourProvider } from './userOnboarding/contexts/TourContext'

const I18nApp = () => {
  const { currentUser, login } = useUserVar()
  const location = useLocation()
  const { from } = location.state || { from: { pathname: '/' } }
  const navigate = useNavigate()
  const {
    data: loginRequiredData,
    loading: loginRequiredLoading,
    called: loginRequiredCalled,
  } = useQuery(IS_LOGIN_REQUIRED, {})

  const [refreshTokens, { data: _refreshData, loading: refreshLoading, error: _refreshError, called: refreshCalled }] =
    useMutation(REFRESH_TOKENS, {
      onError(error) {
        console.error(error.message)
      },
      async onCompleted({ refreshTokens }) {
        try {
          if (refreshTokens.result.__typename === 'AuthResult') {
            // User not logged in yet, set up environment and redirect
            login({
              jwt: refreshTokens.result.authToken,
              tfaSendMethod: refreshTokens.result.user.tfaSendMethod,
              userName: refreshTokens.result.user.userName,
              emailValidated: refreshTokens.result.user.emailValidated,
              insideUser: refreshTokens.result.user.insideUser,
              affiliations: refreshTokens.result.user.affiliations,
              dismissedMessages: refreshTokens.result.user.dismissedMessages,
              completedTours: refreshTokens.result.user.completedTours,
            })
            if (from.pathname !== '/') navigate(from, { replace: true })
          }
          // Non server error occurs
          else if (refreshTokens.result.__typename === 'AuthenticateError') {
            // Could not authenticate
          } else {
            console.warn('Incorrect authenticate.result typename.')
          }
        } finally {
          // Do nothing
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

      const timeoutID = setInterval(async () => {
        await refreshTokens()
      }, (jwtExpiresAfterSeconds - 10) * 1000)
      return () => {
        clearInterval(timeoutID)
      }
    } else {
      //eslint-disable-next-line no-extra-semi
      ;(async () => {
        await refreshTokens()
      })()
    }
  }, [currentUser?.jwt])

  // Initial loading state
  // Do not set to true if refreshLoading is true but user is already logged in as it will cause a flicker.
  const initialLoading =
    !loginRequiredCalled || loginRequiredLoading || !refreshCalled || (refreshLoading && !currentUser?.jwt)

  return (
    <I18nProvider i18n={i18n}>
      <App initialLoading={initialLoading} isLoginRequired={loginRequiredData?.loginRequired} />
    </I18nProvider>
  )
}

const setUpApp = async () => {
  await activate(
    ['en', 'fr'].includes(window.env?.APP_DEFAULT_LANGUAGE) ? window.env?.APP_DEFAULT_LANGUAGE : defaultLocale,
  )

  const root = createRoot(document.getElementById('root'))
  root.render(
    <ApolloProvider client={client}>
      <UserVarProvider userVar={currentUserVar}>
        <ChakraProvider theme={canada}>
          <Router>
            <TourProvider>
              <I18nApp />
            </TourProvider>
          </Router>
        </ChakraProvider>
      </UserVarProvider>
    </ApolloProvider>,
  )

  // If you want your app to work offline and load faster, you can change
  // unregister() to register() below. Note this comes with some pitfalls.
  // Learn more about service workers: https://bit.ly/CRA-PWA
  serviceWorker.unregister()
}

setUpApp()
