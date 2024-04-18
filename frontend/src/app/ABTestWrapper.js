import React from 'react'
import { any, string } from 'prop-types'
import { useUserVar } from '../utilities/userState'

export function ABTestVariant({ children }) {
  return <>{children}</>
}

export function ABTestWrapper({ children, insiderVariantName = 'B' }) {
  const { currentUser } = useUserVar()
  let childIndex = 0

  // only one variant
  if (!children.length) {
    if (currentUser?.insideUser) {
      if (children.props.name === insiderVariantName) return <>{children}</>
      else return <></>
    } else {
      if (children.props.name !== insiderVariantName) return <>{children}</>
      else return <></>
    }
  }
  // A + B variants
  if (currentUser?.insideUser) {
    childIndex = children.findIndex((variant) => variant.props.name === insiderVariantName)
  } else {
    childIndex = children.findIndex((variant) => variant.props.name !== insiderVariantName)
  }
  return <>{children[childIndex]}</>
}

ABTestVariant.propTypes = {
  children: any,
}
ABTestWrapper.propTypes = {
  insiderVariantName: string,
  children: any,
}
