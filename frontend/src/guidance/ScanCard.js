import React from 'react'
import { Accordion, Box, Heading, Stack, Text } from '@chakra-ui/react'
import PropTypes from 'prop-types'

export function ScanCard({ title, description, children }) {
  return (
    <Box bg="white" rounded="lg" overflow="hidden" boxShadow="medium" pb="1">
      <Box bg="primary" color="gray.50">
        <Stack px="3" py="1">
          <Heading as="h1" size="lg">
            {title}
          </Heading>
          <Text fontSize={{ base: 'md', md: 'lg' }}>{description}</Text>
        </Stack>
      </Box>
      <Box>
        <Stack spacing="30px" px="1" mt="1">
          <Accordion
            allowMultiple
            defaultIndex={
              Array.isArray(children)
                ? children.map((_child, idx) => idx)
                : children !== undefined
                ? 1
                : 0
            }
          >
            {children}
          </Accordion>
        </Stack>
      </Box>
    </Box>
  )
}

ScanCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
}
