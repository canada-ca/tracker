import React from 'react'
import { Link as ReactRouterLink } from 'react-router-dom'
import { Box, Flex } from '@chakra-ui/core'
import { node } from 'prop-types'

export const Navigation = ({ children, ...props }) => {
  return (
    <Flex
      as="nav"
      align="center"
      justify="space-between"
      wrap="wrap"
      padding={{ sm: '0.6rem', md: '0.80rem', lg: '1rem', xl: '1rem' }}
      bg="gray.550"
      py={15.5}
      color="white"
      {...props}
    >
      <Flex
        maxW={{ sm: 540, md: 768, lg: 960, xl: 1200 }}
        mx="auto"
        px={4}
        w="100%"
        align="center"
        direction="row"
      >
        <Box
          display={{ sm: 'inline-block', md: 'flex' }}
          width={{ sm: 'full', md: 'auto' }}
          alignItems="center"
          flexGrow={1}
        >
          {React.Children.map(children, (child) => {
            return React.cloneElement(child, {
              as: ReactRouterLink,
              mt: { base: 4, md: 0 },
              mr: 6,
              display: 'inline',
            })
          })}
        </Box>
      </Flex>
    </Flex>
  )
}

Navigation.propTypes = {
  children: node,
}
