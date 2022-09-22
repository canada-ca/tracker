import React from 'react'
import { any } from 'prop-types'
import { useUserVar } from '../utilities/userState'

const isInsiderUser = ({ userName }) => {
  return userName.endsWith('@tbs-sct.gc.ca')
}

export function ABTestingWrapper({ children }) {
  const { currentUser } = useUserVar()
  let childIndex

  if (isInsiderUser({ userName: currentUser?.userName || '' })) {
    childIndex = children.findIndex((variant) => variant.props.name === 'B')
  } else {
    childIndex = children.findIndex((variant) => variant.props.name === 'A')
  }

  console.log(children)
  return <>{children[childIndex]}</>
}

ABTestingWrapper.propTypes = {
  children: any,
}
