import React from 'react'
import { Box } from '@chakra-ui/react'
import { number, oneOfType, string } from 'prop-types'

const WithWrapperBox = (WrappedComponent) => {
  return function WrappedWithBox(props) {
    WrappedWithBox.propTypes = {
      mb: oneOfType([string, number]),
      ml: oneOfType([string, number]),
      mt: oneOfType([string, number]),
      mr: oneOfType([string, number]),
      w: oneOfType([string, number]),
      width: oneOfType([string, number]),
      h: oneOfType([string, number]),
      height: oneOfType([string, number]),
      mx: oneOfType([string, number]),
      my: oneOfType([string, number]),
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
      <Box
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
      </Box>
    )
  }
}

export default WithWrapperBox
