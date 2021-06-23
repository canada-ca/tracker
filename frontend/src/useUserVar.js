import { useApolloClient, useReactiveVar } from '@apollo/client'
import { currentUserVar } from './client'

export const useUserVar = () => {
  const client = useApolloClient()
  const currentUser = useReactiveVar(currentUserVar)

  const isLoggedIn = () => {
    return Object.keys(currentUser).length > 0
  }

  const login = (newUserState) => {
    currentUserVar(newUserState)
  }

  const logout = async () => {
    currentUserVar({})
    await client.resetStore()
  }

  return {
    currentUser,
    isLoggedIn,
    login,
    logout,
  }
}
