import React from 'react'
import PropTypes from 'prop-types'
import { Box } from '@chakra-ui/react'

export const Layout = ({ children, ...props }) => {
  return (
    <Box w="100%" {...props}>
      <Box px={4} layerStyle="pageLayout">
        {children}
      </Box>
    </Box>
  )
}

Layout.propTypes = {
  children: PropTypes.node,
}
