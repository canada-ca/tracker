import React from 'react'
import { Flex, Box } from '@chakra-ui/react'
import { any } from 'prop-types'

export function NotificationBanner({ children, ...props }) {
  return (
    <Box {...props} p="2">
      <Flex
        maxW={{ sm: 540, md: 768, lg: 960, xl: 1200 }}
        flex="1 0 auto"
        mx="auto"
        px={4}
        width="100%"
        align="center"
      >
        {children}
      </Flex>
    </Box>
  )
}

NotificationBanner.propTypes = {
  children: any,
}
