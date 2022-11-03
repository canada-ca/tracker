import React from 'react'
import { any, string } from 'prop-types'
import { useUserVar } from '../utilities/userState'

const isInsiderUser = ({ userName, insideUser }) => {
  return userName.endsWith('@tbs-sct.gc.ca') || insideUser
}

export function ABTestingWrapper({ children, insiderVariantName = 'B' }) {
  const { currentUser } = useUserVar()
  let childIndex = 0

  // only one variant
  if (!children.length) {
    if (
      isInsiderUser({
        userName: currentUser?.userName || '',
        insideUser: currentUser?.insideUser || false,
      })
    ) {
      if (children.props.name === insiderVariantName) return <>{children}</>
      else return <></>
    } else {
      if (children.props.name !== insiderVariantName) return <>{children}</>
      else return <></>
    }
  }
  // A + B variants
  if (
    isInsiderUser({
      userName: currentUser?.userName || '',
      insideUser: currentUser?.insideUser || false,
    })
  ) {
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
