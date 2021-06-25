import React from 'react'
import { Redirect, Route } from 'react-router-dom'
import { bool, node, string } from 'prop-types'

export function RouteIf({ children, alternate, condition, ...rest }) {
  return (
    <Route
      {...rest}
      render={({ location }) =>
        condition ? (
          <Route {...rest} {...{ children }} />
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
  children: node,
  condition: bool.isRequired,
  alternate: string.isRequired,
}
