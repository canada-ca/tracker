import React from 'react'
import PropTypes from 'prop-types'
import { Flex, Tag, Text } from '@chakra-ui/core'
import { Layout } from '../layout'

export function PhaseBanner({ phase, children }) {
  return (
    <Flex bg="gray.100">
      <Layout>
        <Flex align="center" py={4}>
          <Tag
            fontFamily="body"
            letterSpacing={2}
            rounded="none"
            color="black"
            variantColor="gray"
            borderWidth="2px"
            borderColor="gray.900"
            minW="inherit"
            minH="inherit"
            mr={4}
            py={0}
          >
            {phase}
          </Tag>
          <Text fontSize={["xs", "sm", "md"]}>{children}</Text>
        </Flex>
      </Layout>
    </Flex>
  )
}

PhaseBanner.propTypes = {
  phase: PropTypes.node.isRequired,
  children: PropTypes.node,
}
