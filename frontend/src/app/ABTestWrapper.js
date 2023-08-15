import React from 'react'
import { any, string } from 'prop-types'
import { useUserVar } from '../utilities/userState'
import { IS_USER_SUPER_ADMIN } from '../graphql/queries'
import { useQuery } from '@apollo/client'

const isInsiderUser = ({ isUserSuperAdmin, insideUser }) => {
  return insideUser || isUserSuperAdmin
}

export function ABTestVariant({ children }) {
  return <>{children}</>
}

export function ABTestWrapper({ children, insiderVariantName = 'B' }) {
  const { data } = useQuery(IS_USER_SUPER_ADMIN)
  const { currentUser } = useUserVar()
  let childIndex = 0

  // only one variant
  if (!children.length) {
    if (
      isInsiderUser({
        isUserSuperAdmin: data?.isUserSuperAdmin || false,
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
      isUserSuperAdmin: data?.isUserSuperAdmin || false,
      insideUser: currentUser?.insideUser || false,
    })
  ) {
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
