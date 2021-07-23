import React from 'react'
import { func } from 'prop-types'
import { Redirect, useLocation } from 'react-router-dom'
import { useUserVar } from './UserState'
import { Page } from './Page'

// A wrapper for <Page> that redirects to the login
// screen if you're not yet authenticated.
export default function PrivatePage({ children, ...rest }) {
  const { isLoggedIn } = useUserVar()
  const location = useLocation()
  return (
    <Page
      {...rest}
      render={(props) =>
        isLoggedIn() ? (
          children(props)
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
  children: func,
  ...Page.propTypes,
}
