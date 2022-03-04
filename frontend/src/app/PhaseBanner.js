import React from 'react'
import PropTypes from 'prop-types'
import { Flex, Tag, Text } from '@chakra-ui/react'

export function PhaseBanner({ phase, children, ...props }) {
  return (
    <Flex align="center" py="2" {...props}>
      <Tag
        mr="4"
        variant="solid"
        colorScheme="green"
        letterSpacing="2"
        fontWeight="bold"
        size="sm"
      >
        <Text mx="1">{phase}</Text>
      </Tag>
      <Text fontSize={{ base: 'xs', sm: 'xs', md: 'sm' }}>{children}</Text>
    </Flex>
  )
}

PhaseBanner.propTypes = {
  phase: PropTypes.node.isRequired,
  children: PropTypes.node,
}
