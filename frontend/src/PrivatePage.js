import React from 'react'
import { node } from 'prop-types'
import { Redirect, useLocation } from 'react-router-dom'
import { useUserVar } from './useUserVar'
import { Page } from './Page'

// A wrapper for <Page> that redirects to the login
// screen if you're not yet authenticated.
export default function PrivatePage({ children, title, setTitle, ...rest }) {
  const { isLoggedIn } = useUserVar()
  const location = useLocation()
  return (
    <Page
      title={title}
      setTitle={setTitle}
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
  ...Page.propTypes,
}
