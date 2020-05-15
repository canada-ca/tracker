import React from 'react'
import { Route, Redirect } from 'react-router-dom'
import { bool, string, node } from 'prop-types'

export function RouteIf({ children, alternate, condition, ...rest }) {
  return (
    <Route
      {...rest}
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
  alternate: string.isRequired,
}
