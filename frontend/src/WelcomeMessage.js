import React from 'react'
import { Trans } from '@lingui/macro'
import { Box, Divider, Image, SimpleGrid, Stack, Text } from '@chakra-ui/core'
import trackerLogo from './images/tracker_v-03.png'

export function WelcomeMessage() {
  return (
    <Box bg="primary" color="gray.50" align="center">
      <SimpleGrid columns={[1, 2]}>
        <Stack mx="10" my="10">
          <Text
            fontSize={['5xl', '3xl', '3xl', '4xl', '5xl']}
            fontWeight="semibold"
          >
            <Trans>Track Digital Security</Trans>
          </Text>
          <Divider borderColor="accent" borderWidth="2" w="20%" />
          <Text fontSize={['xl', 'sm', 'sm', 'lg', 'xl']}>
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
          boxSize={['0%', '0%', '80%', '80%', '87%']}
          alignSelf="center"
          mx="10"
        />
      </SimpleGrid>
    </Box>
  )
}
