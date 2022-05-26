import React from 'react'
import { bool, node } from 'prop-types'
import { Flex } from '@chakra-ui/react'

export const Main = ({ children }) => (
  <Flex
    layerStyle="pageLayout"
    mx="auto"
    as="main"
    id="main"
    fontFamily="body"
    flex="1 0 auto"
    marginBottom={{ base: '64px', md: 'none' }}
    pt={10}
    bg="gray.50"
  >
    {children}
  </Flex>
)

Main.propTypes = { children: node, slideMessageOpen: bool }
