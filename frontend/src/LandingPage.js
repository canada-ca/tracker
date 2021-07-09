import React from 'react'
import trackerLogo from './images/trackerlogo.svg'
import { Box, Divider, Grid, Image, Text } from '@chakra-ui/react'
import { Trans } from '@lingui/macro'

export function LandingPage() {
  return (
    <Grid
      bg="primary"
      height="fit-content"
      templateAreas={{ sm: 'welcome', md: 'welcome logo' }}
      templateColumns={{ sm: '1fr', md: '1fr 1fr' }}
    >
      <Box mx="10" my="10">
        <Text
          fontSize={['2xl', '2xl', '2xl', '3xl', '4xl']}
          fontWeight="semibold"
          color="white"
        >
          <Trans>Track Digital Security</Trans>
        </Text>
        <Divider borderColor="accent" borderWidth="2" w="20%" />
        <Text color="white" fontSize={['sm', 'sm', 'sm', 'lg', 'xl']}>
          <Trans>
            Canadians rely on the Government of Canada to provide secure digital
            services. The Policy on Service and Digital guides government online
            services to adopt good security practices for email and web
            services. Track how government sites are becoming more secure.
          </Trans>
        </Text>
      </Box>
      <Box
        display={{ xs: 'none', sm: 'none', md: 'flex' }}
        bg="primary"
        justifyContent="center"
      >
        <Image
          bg="white"
          p="2em"
          src={trackerLogo}
          alt={'Tracker Logo'}
          width="auto"
          height={['0%', '80%', '80%', '87%']}
          alignSelf="center"
        />
      </Box>
    </Grid>
  )
}
