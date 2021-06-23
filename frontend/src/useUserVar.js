import React, { useContext } from 'react'
import { makeVar, useApolloClient, useReactiveVar } from '@apollo/client'
import { object, node } from 'prop-types'

const UserVarContext = React.createContext({})
const { Provider, Consumer } = UserVarContext

export function UserVarProvider({ userVar = makeVar({}), children }) {
  const client = useApolloClient()
  const currentUser = useReactiveVar(userVar)

  const isLoggedIn = () => {
    return Object.keys(currentUser).length > 0
  }

  const login = (newUserState) => {
    userVar(newUserState)
  }

  const logout = async () => {
    userVar({})
    await client.resetStore()
  }

  const userState = {
    currentUser,
    isLoggedIn,
    login,
    logout,
  }

  return <Provider value={userState}>{children}</Provider>
}

UserVarProvider.propTypes = {
  userVar: object.isRequired,
  children: node.isRequired,
}

export const UserVar = Consumer

export const useUserVar = () => useContext(UserVarContext)
