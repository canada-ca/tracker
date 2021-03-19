import React from 'react'
import { Layout } from './Layout'
import { Image, Stack } from '@chakra-ui/core'
import trackerLogo from './images/tracker_v-03.png'
import { WelcomeMessage } from './WelcomeMessage'

export function LandingPage() {
  return (
    <Layout>
      <Stack align="center">
        <Image
          src={trackerLogo}
          alt={'Tracker Logo'}
          size={['100%', '100%', '0%', '0%', '0%']}
        />
        <WelcomeMessage />
      </Stack>
    </Layout>
  )
}
