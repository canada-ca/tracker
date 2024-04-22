import React from 'react'
import { useQuery } from '@apollo/client'
import { IS_USER_SUPER_ADMIN } from '../graphql/queries'
import { LoadingMessage } from '../components/LoadingMessage'

const withSuperAdmin = (Component) => {
  const WrappedComponent = (props) => {
    const { loading, data: { isUserSuperAdmin } = {} } = useQuery(IS_USER_SUPER_ADMIN)

    if (loading) return <LoadingMessage />
    return isUserSuperAdmin ? <Component {...props} /> : null
  }

  WrappedComponent.displayName = `withSuperAdmin(${Component.displayName || Component.name})`

  return WrappedComponent
}

export default withSuperAdmin
