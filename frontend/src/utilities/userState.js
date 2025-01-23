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
    insideUser: null,
    affiliations: null,
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
      currentUser?.emailValidated ||
      currentUser?.insideUser ||
      currentUser?.affiliations
    )
  }

  const isEmailValidated = () => {
    return currentUser?.emailValidated
  }

  const currentTFAMethod = () => {
    return currentUser?.tfaSendMethod
  }

  const hasAffiliation = () => {
    return currentUser?.affiliations?.totalCount > 0
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
      insideUser: null,
      affiliations: null,
      dismissedMessages: null,
    })
    await client.resetStore()
  }

  const userState = {
    currentUser,
    isLoggedIn,
    isEmailValidated,
    currentTFAMethod,
    hasAffiliation,
    login,
    logout,
  }

  return <Provider value={userState}>{children}</Provider>
}

UserVarProvider.propTypes = {
  userVar: func.isRequired,
  children: node.isRequired,
}
