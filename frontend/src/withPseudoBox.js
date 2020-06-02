import React from 'react'
import { PseudoBox } from '@chakra-ui/core'
import { string } from 'prop-types'

export const withPseudoBoxPropTypes = {
  mb: string,
  ml: string,
  mt: string,
  mr: string,
  align: string,
}

const WithPseudoBox = (WrappedComponent) => {
  return function WrappedWithPseudoBox(props) {
    // eslint-disable-next-line react/prop-types
    const { mb, ml, mt, mr, align, ...passThroughProps } = props
    return (
      <PseudoBox mb={mb} ml={ml} mt={mt} mr={mr} align={align}>
        <WrappedComponent {...passThroughProps} />
      </PseudoBox>
    )
  }
}

export default WithPseudoBox
