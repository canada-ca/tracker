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
        templateColumns={{ sm: '1fr', md: '4fr 3fr' }}
      >
        <Box mx="10" my="10">
          <Text
            fontSize={{ base: '2xl', lg: '3xl', xl: '4xl' }}
            fontWeight="semibold"
            color="white"
          >
            <Trans>Tracker 2.0</Trans>
          </Text>
          <Divider borderColor="accent" my={2} borderTopWidth="2" w="20%" />
          <Text color="white" fontSize={{ base: 'sm', lg: 'lg', xl: 'xl' }}>
            <Trans>
              The Government of Canada is committed to providing secure and
              accessible digital services to Canadians. Tracker improves on its
              predecessor by increasing its scanning accuracy for web security
              and HTTPS compliance, and by providing tailored feedback for each
              domain. Email security is an integral part of enabling secure
              digital services and has been built into Tracker to provide
              in-depth DMARC compliance reporting. Track how the Government of
              Canada’s digital services are becoming more secure.
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
            width={{ md: '80%', lg: '87%' }}
            height="auto"
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
