import React from 'react'
import { bool, func } from 'prop-types'
import { Navigate, useLocation } from 'react-router-dom'
import { Page } from './Page'

// A wrapper for <Page> that redirects to the login
// screen if you're not yet authenticated.
export function PrivatePage({ children, condition, ...rest }) {
  const location = useLocation()

  return <Page {...rest}>{condition ? children : <Navigate to="/sign-in" state={{ from: location }} />}</Page>
}

PrivatePage.propTypes = {
  children: func,
  isLoginRequired: bool,
  condition: bool,
  ...Page.propTypes,
}
