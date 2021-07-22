import React from 'react'
import PropTypes from 'prop-types'
import { Flex, Tag, Text } from '@chakra-ui/react'
import { Layout } from './Layout'

export function PhaseBanner({ phase, children }) {
  return (
    <Layout bg="gray.100">
      <Flex align="center" py={4}>
        <Tag
          fontFamily="body"
          letterSpacing={2}
          rounded="none"
          color="black"
          colorScheme="gray"
          borderWidth="2px"
          borderColor="gray.900"
          minW="inherit"
          minH="inherit"
          mr={4}
          py={1}
          size="lg"
        >
          {phase}
        </Tag>
        <Text fontSize={{ base: 'xs', sm: 'sm', md: 'md' }}>{children}</Text>
      </Flex>
    </Layout>
  )
}

PhaseBanner.propTypes = {
  phase: PropTypes.node.isRequired,
  children: PropTypes.node,
}
