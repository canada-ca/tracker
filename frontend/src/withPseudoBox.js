import React from 'react'
import { PseudoBox } from '@chakra-ui/core'
import { string } from 'prop-types'

export const withPseudoBoxPropTypes = {
  mb: string,
  ml: string,
  mt: string,
  mr: string,
}

const WithPseudoBox = (WrappedComponent) => {
  return function WrappedWithPseudoBox(props) {
    // eslint-disable-next-line no-unused-vars,react/prop-types
    const { withPseudoBoxPropTypes, ...passThroughProps } = props
    return (
      <PseudoBox {...props}>
        <WrappedComponent {...passThroughProps} />
      </PseudoBox>
    )
  }
}

export default WithPseudoBox
