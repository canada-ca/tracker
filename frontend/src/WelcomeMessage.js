import React from 'react'
import { Trans } from '@lingui/macro'
import { Box, Divider, Image, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import trackerLogo from './images/tracker_v-03.png'

export function WelcomeMessage() {
  return (
    <Box bg="primary" color="gray.50" align="center">
      <SimpleGrid columns={{ base: 1, md: 2 }}>
        <Stack mx="10" my="10">
          <Text
            fontSize={{ base: '3xl', md: '4xl', lg: '5xl' }}
            fontWeight="semibold"
          >
            <Trans>Track Digital Security</Trans>
          </Text>
          <Divider borderColor="accent" borderWidth="2" w="20%" />
          <Text fontSize={{ base: 'sm', md: 'lg', lg: 'xl' }}>
            <Trans>
              Canadians rely on the Government of Canada to provide secure
              digital services. The Policy on Service and Digital guides
              government online services to adopt good security practices for
              email and web services. Track how government sites are becoming
              more secure.
            </Trans>
          </Text>
        </Stack>
        <Image
          src={trackerLogo}
          alt={'Tracker Logo'}
          boxSize={{ base: '0%', md: '80%', lg: '87%' }}
          alignSelf="center"
          mx="10"
        />
      </SimpleGrid>
    </Box>
  )
}
