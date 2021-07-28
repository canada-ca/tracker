import React from 'react'
import trackerLogo from './images/trackerlogo.svg'
import { Box, Divider, Grid, Image, Stack, Text } from '@chakra-ui/react'
import { Trans } from '@lingui/macro'
import { LandingPageSummaries } from './LandingPageSummaries'
import { useUserVar } from './UserState'

export function LandingPage() {
  const { isLoggedIn } = useUserVar()

  return (
    <Stack>
      <Grid
        bg="primary"
        height="fit-content"
        templateAreas={{ sm: 'welcome', md: 'welcome logo' }}
        templateColumns={{ sm: '1fr', md: '1fr 1fr' }}
      >
        <Box mx="10" my="10">
          <Text
            fontSize={{ base: '2xl', lg: '3xl', xl: '4xl' }}
            fontWeight="semibold"
            color="white"
          >
            <Trans>Track Digital Security</Trans>
          </Text>
          <Divider borderColor="accent" my={2} borderTopWidth="2" w="20%" />
          <Text color="white" fontSize={{ base: 'sm', lg: 'lg', xl: 'xl' }}>
            <Trans>
              Canadians rely on the Government of Canada to provide secure
              digital services. The Policy on Service and Digital guides
              government online services to adopt good security practices for
              email and web services. Track how government sites are becoming
              more secure.
            </Trans>
          </Text>
        </Box>
        <Box
          display={{ base: 'none', md: 'flex' }}
          bg="primary"
          justifyContent="center"
        >
          <Image
            bg="white"
            p="2em"
            src={trackerLogo}
            alt={'Tracker Logo'}
            width="auto"
            height={{ md: '80%', lg: '87%' }}
            alignSelf="center"
          />
        </Box>
      </Grid>
      {isLoggedIn() && (
        <Box pt={7}>
          <LandingPageSummaries />
        </Box>
      )}
    </Stack>
  )
}
