// From https://reactrouter.com/web/example/auth-workflow

import React from 'react'
import { node } from 'prop-types'
import { Route, Redirect, useLocation } from 'react-router-dom'
import { useUserState } from './UserState'

// A wrapper for <Route> that redirects to the login
// screen if you're not yet authenticated.
export default function PrivateRoute({ children, ...rest }) {
  const { isLoggedIn } = useUserState()
  const location = useLocation()
  return (
    <Route
      {...rest}
      render={() =>
        isLoggedIn() ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: '/sign-in',
              state: { from: location },
            }}
          />
        )
      }
    />
  )
}

PrivateRoute.propTypes = {
  children: node,
}
