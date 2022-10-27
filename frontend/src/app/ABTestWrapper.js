import React from 'react'
import { any, string } from 'prop-types'
import { useUserVar } from '../utilities/userState'

const isInsiderUser = ({ userName }) => {
  return userName.endsWith('@tbs-sct.gc.ca')
}

export function ABTestingWrapper({ children, insiderVariantName = 'B' }) {
  const { currentUser } = useUserVar()
  let childIndex = 0

  // only one variant
  if (!children.length) {
    if (isInsiderUser({ userName: currentUser?.userName || '' })) {
      if (children.props.name === insiderVariantName) return <>{children}</>
      else return <></>
    } else {
      if (children.props.name !== insiderVariantName) return <>{children}</>
      else return <></>
    }
  }
  // A + B variants
  if (isInsiderUser({ userName: currentUser?.userName || '' })) {
    childIndex = children.findIndex(
      (variant) => variant.props.name === insiderVariantName,
    )
  } else {
    childIndex = children.findIndex(
      (variant) => variant.props.name !== insiderVariantName,
    )
  }
  return <>{children[childIndex]}</>
}

ABTestingWrapper.propTypes = {
  insiderVariantName: string,
  children: any,
}
