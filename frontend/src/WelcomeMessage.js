import React from 'react'
import { Trans } from '@lingui/macro'
import { Layout } from './Layout'
import { Heading, Text, Box, Divider, SimpleGrid } from '@chakra-ui/core'

export function WelcomeMessage() {
  return (
    <Box bg="primary" color="gray.50" align="center">
      <SimpleGrid columns={[1, 2]}>
        <Heading as="h1" ml="10" mt="10" mb={['0', '10']}>
          <Trans>Track Web Security Compliance</Trans>
          <Divider borderColor="accent" borderWidth="2" w="15%" />
        </Heading>
        <Text fontSize="lg" mx="10" my="10">
          <Trans>
            Canadians rely on the Government of Canada to provide secure digital
            services. A new policy notice guides government websites to adopt
            good web security practices. Track how government sites are becoming
            more secure.
          </Trans>
        </Text>
      </SimpleGrid>
    </Box>
  )
}
