import React from 'react'
import { any } from 'prop-types'

export function ABTestVariant({ children }) {
  return <>{children}</>
}

ABTestVariant.propTypes = {
  children: any,
}
