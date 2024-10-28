import React from 'react'
import { bool, string } from 'prop-types'
import { Navigate, useLocation } from 'react-router-dom'

import { Page } from './Page'

import { useUserVar } from '../utilities/userState'

// A wrapper for <Page> that redirects to the login
// screen if you're not yet authenticated.
export function PrivatePage({ isLoginRequired, isAuthed, redirectTo = '/sign-in', title, setTitle, children }) {
  const { isLoggedIn, isEmailValidated } = useUserVar()
  const location = useLocation()

  const isAuthenticated = isAuthed !== undefined ? isAuthed : (isLoggedIn() && isEmailValidated()) || !isLoginRequired

  return isAuthenticated ? (
    <Page title={title} setTitle={setTitle}>
      {children}
    </Page>
  ) : (
    <Navigate
      to={{
        pathname: redirectTo,
        state: { from: location },
      }}
    />
  )
}

PrivatePage.propTypes = {
  isLoginRequired: bool,
  isAuthed: bool,
  redirectTo: string,
  ...Page.propTypes,
}
