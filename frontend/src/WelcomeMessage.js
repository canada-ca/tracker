import React from 'react'
import { Trans } from '@lingui/macro'
import { Text, Box, Divider, SimpleGrid, Stack, Image } from '@chakra-ui/core'
import trackerLogo from './images/tracker_v-03.png'
import { useLingui } from '@lingui/react'

export function WelcomeMessage() {
  const { i18n } = useLingui()

  return (
    <Box bg="primary" color="gray.50" align="center">
      <SimpleGrid columns={[1, 2]}>
        <Stack align="center" mx="10" my="10">
          <Text fontSize="5xl" fontWeight="semibold">
            <Trans>Track Web Security Compliance</Trans>
            <Divider borderColor="accent" borderWidth="2" w="20%" />
          </Text>
          <Text fontSize="xl">
            <Trans>
              Canadians rely on the Government of Canada to provide secure
              digital services. A new policy notice guides government websites
              to adopt good web security practices. Track how government sites
              are becoming more secure.
            </Trans>
          </Text>
        </Stack>
        <Image
          src={trackerLogo}
          alt={i18n._('Tracker Logo')}
          size="80%"
          alignSelf="center"
          mx="10"
        />
      </SimpleGrid>
    </Box>
  )
}
