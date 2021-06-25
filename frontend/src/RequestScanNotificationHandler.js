import React from 'react'
import { useSubscription } from '@apollo/client'
import { DKIM_SCAN_DATA } from './graphql/subscriptions'
import { Box } from '@chakra-ui/core'

export default function RequestScanNotificationHandler() {
  const {
    data: { scanResults },
    loading,
  } = useSubscription(DKIM_SCAN_DATA, {
    // skip: !isLoggedIn,
  })

  return <Box>Request Scan Notification Handler</Box>
}
