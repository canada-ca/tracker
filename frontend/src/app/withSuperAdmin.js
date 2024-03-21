import React from 'react'
import { useQuery } from '@apollo/client'
import { IS_USER_SUPER_ADMIN } from '../graphql/queries'

const withSuperAdmin = (Component) => {
  const WrappedComponent = (props) => {
    const { loading, error, data } = useQuery(IS_USER_SUPER_ADMIN)

    if (loading) return <p>Loading...</p>
    if (error) return <p>Error</p>

    return data.isUserSuperAdmin ? <Component {...props} /> : null
  }

  WrappedComponent.displayName = `withSuperAdmin(${Component.displayName || Component.name})`

  return WrappedComponent
}

export default withSuperAdmin
