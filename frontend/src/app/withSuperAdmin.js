import React from 'react'
import { useQuery } from '@apollo/client'
import { IS_USER_SUPER_ADMIN } from '../graphql/queries'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { LoadingMessage } from '../components/LoadingMessage'
import { useUserVar } from '../utilities/userState'

const withSuperAdmin = (Component) => {
  const WrappedComponent = (props) => {
    const { isLoggedIn } = useUserVar()
    const { loading, error, data: { isUserSuperAdmin } = {} } = useQuery(IS_USER_SUPER_ADMIN)

    if (!isLoggedIn) return null
    if (loading) return <LoadingMessage />
    if (error) return <ErrorFallbackMessage error={error} />

    return isUserSuperAdmin ? <Component {...props} /> : null
  }

  WrappedComponent.displayName = `withSuperAdmin(${Component.displayName || Component.name})`

  return WrappedComponent
}

export default withSuperAdmin
