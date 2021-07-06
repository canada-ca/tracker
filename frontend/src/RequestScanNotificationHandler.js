import React, { useEffect } from 'react'
import { useSubscription, gql } from '@apollo/client'
import {
  DKIM_SCAN_DATA,
  DMARC_SCAN_DATA,
  HTTPS_SCAN_DATA,
  SPF_SCAN_DATA,
  SSL_SCAN_DATA,
} from './graphql/subscriptions'
import { Box, Heading, Text, useToast } from '@chakra-ui/core'
import { useUserVar } from './UserState'
import { t } from '@lingui/macro'
import { ONE_TIME_SSL_SCANS, ONE_TIME_SSL_SCANS_SHORT } from './graphql/queries'

export default function RequestScanNotificationHandler({ ...props }) {
  const { isLoggedIn } = useUserVar()

  const toast = useToast()

  const { data: dkimData } = useSubscription(DKIM_SCAN_DATA, {
    skip: !isLoggedIn(),
    onSubscriptionData: ({ subscriptionData }) => {},
  })
  const { data: dmarcData } = useSubscription(DMARC_SCAN_DATA, {
    skip: !isLoggedIn(),
    onSubscriptionData: ({ subscriptionData }) => {
      toast({
        title: t`DNS Scan Complete`,
        description: t`DNS scan for domain "${subscriptionData.data.dmarcScanData.domain.domain}" has completed. Information for SPF, SSL, and DKIM is available on the one time scan page.`,
        status: 'info',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
  })
  const { data: spfData } = useSubscription(SPF_SCAN_DATA, {
    skip: !isLoggedIn(),
    onSubscriptionData: ({ subscriptionData }) => {},
  })
  const { data: sslData } = useSubscription(SSL_SCAN_DATA, {
    skip: !isLoggedIn(),
    onSubscriptionData: ({ subscriptionData }) => {
      toast({
        title: t`SSL Scan Complete`,
        description: t`SSL scan for domain "${subscriptionData.data.sslScanData.domain.domain}" has completed. Information for the scan is available on the one time scan page.`,
        status: 'info',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
  })
  const { data: httpsData } = useSubscription(HTTPS_SCAN_DATA, {
    skip: !isLoggedIn(),
    onSubscriptionData: ({ subscriptionData }) => {
      toast({
        title: t`HTTPS Scan Complete`,
        description: t`HTTPS scan for domain "${subscriptionData.data.httpsScanData.domain.domain}" has completed. Information for the scan is available on the one time scan page.`,
        status: 'info',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
  })

  return (
    <Box {...props}>
      <Heading>Request Scan Notification Handler</Heading>
    </Box>
  )
}
