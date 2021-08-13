import React from 'react'
import { func } from 'prop-types'
import { Redirect, useLocation } from 'react-router-dom'

import { Page } from './Page'

import { useUserVar } from '../utilities/userState'

// A wrapper for <Page> that redirects to the login
// screen if you're not yet authenticated.
export function PrivatePage({ children, ...rest }) {
  const { isLoggedIn, isEmailValidated } = useUserVar()
  const location = useLocation()
  return (
    <Page
      {...rest}
      render={(props) =>
        isLoggedIn() && isEmailValidated() ? (
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
