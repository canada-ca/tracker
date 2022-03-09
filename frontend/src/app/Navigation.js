import React from 'react'
import { Link as ReactRouterLink } from 'react-router-dom'
import { Flex, Stack } from '@chakra-ui/react'
import { node } from 'prop-types'

export const Navigation = ({ children, ...props }) => {
  return (
    <Flex
      as="nav"
      padding={{ sm: '0.6rem', md: '0.80rem', lg: '1rem', xl: '1rem' }}
      color="primary"
      borderBottom="2px solid"
      borderBottomColor="black"
      display={{ base: 'none', md: 'flex' }}
      mr="12"
      {...props}
    >
      <Stack
        ml="auto"
        isInline
        alignItems="center"
        flexWrap="wrap"
        spacing={{ md: '4', lg: '6' }}
        fontWeight="semibold"
      >
        {React.Children.map(children, (child) => {
          if (child !== null) {
            return React.cloneElement(child, {
              as: ReactRouterLink,
            })
          }
        })}
      </Stack>
    </Flex>
  )
}

Navigation.propTypes = {
  children: node,
}
