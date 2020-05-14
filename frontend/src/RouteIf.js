import React from 'react'
import { Route, Redirect } from 'react-router-dom'
import { bool, string, node } from 'prop-types'

export function RouteIf({ children, condition, consequent, alternate }) {
  return (
    <Route
      path={consequent}
      render={({ location }) =>
        condition ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: alternate,
              state: { from: location },
            }}
          />
        )
      }
    />
  )
}

RouteIf.propTypes = {
  children: node.isRequired,
  condition: bool.isRequired,
  consequent: string.isRequired,
  alternate: string.isRequired,
}
