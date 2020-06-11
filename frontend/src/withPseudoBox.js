import React from 'react'
import { PseudoBox } from '@chakra-ui/core'
import { string } from 'prop-types'

const WithPseudoBox = (WrappedComponent) => {
  return function WrappedWithPseudoBox(props) {
    WrappedWithPseudoBox.propTypes = {
      mb: string,
      ml: string,
      mt: string,
      mr: string,
      w: string,
      width: string,
      h: string,
      height: string,
      mx: string,
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
