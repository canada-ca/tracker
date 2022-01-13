import React, { useContext } from 'react'
import { makeVar, useApolloClient, useReactiveVar } from '@apollo/client'
import { node, func } from 'prop-types'

const UserVarContext = React.createContext({})
const { Provider } = UserVarContext

export const useUserVar = () => useContext(UserVarContext)

export function UserVarProvider({
  userVar = makeVar({
    jwt: null,
    tfaSendMethod: null,
    userName: null,
    emailValidated: null,
  }),
  children,
}) {
  const client = useApolloClient()
  const currentUser = useReactiveVar(userVar)

  const isLoggedIn = () => {
    return !!(
      currentUser?.jwt ||
      currentUser?.userName ||
      currentUser?.tfaSendMethod ||
      currentUser?.emailValidated
    )
  }

  const isEmailValidated = () => {
    return currentUser?.emailValidated
  }

  const currentTFAMethod = () => {
    return currentUser?.tfaSendMethod
  }

  const login = (newUserState) => {
    userVar(newUserState)
  }

  const logout = async () => {
    userVar({
      jwt: null,
      userName: null,
      tfaSendMethod: null,
      emailValidated: null,
    })
    await client.resetStore()
  }

  const userState = {
    currentUser,
    isLoggedIn,
    isEmailValidated,
    currentTFAMethod,
    login,
    logout,
  }

  return <Provider value={userState}>{children}</Provider>
}

UserVarProvider.propTypes = {
  userVar: func.isRequired,
  children: node.isRequired,
}
