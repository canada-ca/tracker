import React from 'react'
import { PseudoBox } from '@chakra-ui/core'
import { string, number, oneOfType } from 'prop-types'

const WithPseudoBox = (WrappedComponent) => {
  return function WrappedWithPseudoBox(props) {
    WrappedWithPseudoBox.propTypes = {
      mb: oneOfType([string, number]),
      ml: oneOfType([string, number]),
      mt: oneOfType([string, number]),
      mr: oneOfType([string, number]),
      w: oneOfType([string, number]),
      width: oneOfType([string, number]),
      h: oneOfType([string, number]),
      height: oneOfType([string, number]),
      mx: oneOfType([string, number]),
    }
    const {
      mb,
      ml,
      mt,
      mr,
      w,
      width,
      h,
      height,
      mx,
      ...passThroughProps
    } = props
    return (
      <PseudoBox
        mb={mb}
        ml={ml}
        mt={mt}
        mr={mr}
        w={w}
        width={width}
        h={h}
        height={height}
        mx={mx}
      >
        <WrappedComponent {...passThroughProps} />
      </PseudoBox>
    )
  }
}

export default WithPseudoBox
