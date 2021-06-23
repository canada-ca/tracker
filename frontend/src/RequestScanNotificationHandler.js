import React from 'react'
import { useSubscription } from '@apollo/client'
import { DKIM_SCAN_DATA } from './graphql/subscriptions'
import { useUserState } from './UserState'
import { Box } from '@chakra-ui/core'

export default function RequestScanNotificationHandler() {
  const { currentUser, isLoggedIn } = useUserState()

  const {
    data: { scanResults },
    loading,
  } = useSubscription(DKIM_SCAN_DATA, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
    skip: !isLoggedIn,
  })

  console.log({ loading })
  console.log({ scanResults })

  return <Box>Request Scan Notification Handler</Box>
}
