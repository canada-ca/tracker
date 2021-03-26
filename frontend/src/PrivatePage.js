// From https://reactrouter.com/web/example/auth-workflow

import React from 'react'
import { node, string } from 'prop-types'
import { Redirect, useLocation } from 'react-router-dom'
import { useUserState } from './UserState'
import { Page } from './Page'

// A wrapper for <Route> that redirects to the login
// screen if you're not yet authenticated.
export default function PrivatePage({ children, title, ...rest }) {
  const { isLoggedIn } = useUserState()
  const location = useLocation()
  return (
    <Page
      title={title}
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

PrivatePage.propTypes = {
  children: node,
  title: string,
}
