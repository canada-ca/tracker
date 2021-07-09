import React from 'react'
import PropTypes from 'prop-types'
import { Box } from '@chakra-ui/react'

export const Layout = ({ fluid, columns, ...props }) => {
  const col = {
    base: columns.base * 100 + '%',
    md: columns.md * 100 + '%',
    lg: columns.lg * 100 + '%',
    xl: columns.xl * 100 + '%',
  }

  return (
    <Box
      {...(fluid
        ? { w: '100%' }
        : {
            maxW: { sm: 540, md: 768, lg: 960, xl: 1200 },
            mx: 'auto',
            px: 4,
            w: '100%',
          })}
      {...props}
    >
      <Box w={col}>{props.children}</Box>
    </Box>
  )
}

Layout.propTypes = {
  fluid: PropTypes.bool,
  columns: PropTypes.any,
  children: PropTypes.node,
}

Layout.defaultProps = {
  fluid: false,
  columns: { base: 1, md: 1, lg: 1, xl: 1 },
}
