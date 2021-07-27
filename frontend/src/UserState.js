import React, { useEffect, useContext } from 'react'
import {
  makeVar,
  useApolloClient,
  useReactiveVar,
  useMutation,
} from '@apollo/client'
import { node, func } from 'prop-types'
import { REFRESH_TOKENS } from './graphql/mutations'
import { activate } from './i18n.config'
import { useHistory, useLocation } from 'react-router-dom'

const UserVarContext = React.createContext({})
const { Provider } = UserVarContext

export function UserVarProvider({
  userVar = makeVar({ jwt: null, tfaSendMethod: null, userName: null }),
  children,
}) {
  const client = useApolloClient()
  const currentUser = useReactiveVar(userVar)
  const location = useLocation()
  const { from } = location.state || { from: { pathname: '/' } }
  const history = useHistory()

  const isLoggedIn = () => {
    return !!(
      currentUser?.jwt ||
      currentUser?.userName ||
      currentUser?.tfaSendMethod
    )
  }

  const login = (newUserState) => {
    userVar(newUserState)
  }

  const logout = async () => {
    userVar({ jwt: null, userName: null, tfaSendMethod: null })
    await client.resetStore()
  }

  const userState = {
    currentUser,
    isLoggedIn,
    login,
    logout,
  }

  const [refreshTokens, { _loading }] = useMutation(REFRESH_TOKENS, {
    onError(error) {
      console.error(error.message)
    },
    onCompleted({ refreshTokens }) {
      if (refreshTokens.result.__typename === 'AuthResult') {
        login({
          jwt: refreshTokens.result.authToken,
          tfaSendMethod: refreshTokens.result.user.tfaSendMethod,
          userName: refreshTokens.result.user.userName,
        })
        if (refreshTokens.result.user.preferredLang === 'ENGLISH')
          activate('en')
        else if (refreshTokens.result.user.preferredLang === 'FRENCH')
          activate('fr')
        history.replace(from)
      }
      // Non server error occurs
      else if (refreshTokens.result.__typename === 'AuthenticateError') {
        // Could not authenticate
        console.warn('failed session refresh')
      } else {
        console.warn('Incorrect authenticate.result typename.')
      }
    },
  })

  // useEffect(() => {
  //   if (currentUser?.jwt) {
  //     // const jwt =
  //     //   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2Mjc5MjQ2MTcsImlhdCI6MTYyNzMxOTgxNywicGFyYW1ldGVycyI6eyJ1c2VyS2V5IjoiMjUwOTAxMiIsInV1aWQiOiJkYTM4MzhiZC1jNmM4LTRiODYtOWEwOC1hODdhMzgxZTU3YjUifX0.3G6Nyl7eicmGXKPrZi8j7MTAtsvlfLPx_RiLz_GW42A'
  //     // const jwtPayload = jwt.split('.')[1]
  //     const jwtPayload = currentUser.jwt.split('.')[1]
  //     const payloadDecoded = window.atob(jwtPayload)
  //     const jwtExpiryTimeSeconds = JSON.parse(payloadDecoded).exp
  //     // using seconds as that's what the api uses
  //     const currentTimeSeconds = Math.floor(new Date().getTime() / 1000)
  //     const jwtExpiresAfterSeconds = jwtExpiryTimeSeconds - currentTimeSeconds
  //     const timeoutID = setTimeout(
  //       refreshTokens,
  //       (jwtExpiresAfterSeconds - 60) * 1000,
  //     )
  //     return () => {
  //       clearTimeout(timeoutID)
  //     }
  //   } else {
  //     refreshTokens()
  //   }
  // }, [currentUser, refreshTokens])

  useEffect(() => {
    refreshTokens()
  }, [refreshTokens])

  return <Provider value={userState}>{children}</Provider>
}

UserVarProvider.propTypes = {
  userVar: func.isRequired,
  children: node.isRequired,
}

export const useUserVar = () => useContext(UserVarContext)
