import { useApolloClient, useReactiveVar } from '@apollo/client'
import { currentUserVar } from './client'

export const useUserVar = (userVar = currentUserVar) => {
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

  return {
    currentUser,
    isLoggedIn,
    login,
    logout,
  }
}
