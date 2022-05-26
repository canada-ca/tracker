import React from 'react'
import PropTypes from 'prop-types'
import { Box } from '@chakra-ui/react'

export const Layout = ({ children, ...props }) => {
  return (
    <Box w="100%" px="4" {...props}>
      {children}
    </Box>
  )
}

Layout.propTypes = {
  children: PropTypes.node,
}
