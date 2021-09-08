import React from 'react'
import PropTypes from 'prop-types'
import { Flex, Tag, Text } from '@chakra-ui/react'

import { Layout } from '../components/Layout'

export function PhaseBanner({ phase, children }) {
  return (
    <Layout bg="gray.100">
      <Flex align="center" py={2}>
        <Tag
          mr={4}
          variant="solid"
          colorScheme="green"
          letterSpacing={2}
          fontWeight="bold"
          size="sm"
        >
          {phase}
        </Tag>
        <Text fontSize={{ base: 'xs', sm: 'xs', md: 'sm' }}>{children}</Text>
      </Flex>
    </Layout>
  )
}

PhaseBanner.propTypes = {
  phase: PropTypes.node.isRequired,
  children: PropTypes.node,
}
