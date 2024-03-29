import React from 'react'
import { useSubscription } from '@apollo/client'
import { Box, useToast } from '@chakra-ui/react'
import { t } from '@lingui/macro'
import { node } from 'prop-types'

import { useUserVar } from '../utilities/userState'
import {
  GET_ONE_TIME_DKIM_SCANS,
  GET_ONE_TIME_DMARC_SCANS,
  GET_ONE_TIME_HTTPS_SCANS,
  GET_ONE_TIME_SCANS,
  GET_ONE_TIME_SPF_SCANS,
  GET_ONE_TIME_SSL_SCANS,
} from '../graphql/queries'
import {
  DKIM_SCAN_DATA,
  DMARC_SCAN_DATA,
  HTTPS_SCAN_DATA,
  SPF_SCAN_DATA,
  SSL_SCAN_DATA,
} from '../graphql/subscriptions'

export function RequestScanNotificationHandler({ children, ...props }) {
  const { isLoggedIn } = useUserVar()

  const toast = useToast()

  const { data: _dkimData } = useSubscription(DKIM_SCAN_DATA, {
    skip: !isLoggedIn(),
    onSubscriptionData: ({ subscriptionData, client }) => {
      client.cache.writeQuery({
        query: GET_ONE_TIME_SCANS,
        data: { getOneTimeScans: subscriptionData.data.dkimScanData },
      })
    },
  })
  const { data: _dmarcData } = useSubscription(DMARC_SCAN_DATA, {
    skip: !isLoggedIn(),
    onSubscriptionData: ({ subscriptionData, client }) => {
      client.cache.writeQuery({
        query: GET_ONE_TIME_SCANS,
        data: { getOneTimeScans: subscriptionData.data.dmarcScanData },
      })
      toast({
        title: t`DNS Scan Complete`,
        description: t`DNS scan for domain "${subscriptionData.data.dmarcScanData.domain.domain}" has completed.`,
        status: 'info',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
  })
  const { data: _spfData } = useSubscription(SPF_SCAN_DATA, {
    skip: !isLoggedIn(),
    onSubscriptionData: ({ subscriptionData, client }) => {
      client.cache.writeQuery({
        query: GET_ONE_TIME_SCANS,
        data: { getOneTimeScans: subscriptionData.data.spfScanData },
      })
    },
  })
  const { data: _sslData } = useSubscription(SSL_SCAN_DATA, {
    skip: !isLoggedIn(),
    onSubscriptionData: ({ subscriptionData, client }) => {
      client.cache.writeQuery({
        query: GET_ONE_TIME_SCANS,
        data: { getOneTimeScans: subscriptionData.data.sslScanData },
      })
      toast({
        title: t`TLS Scan Complete`,
        description: t`TLS scan for domain "${subscriptionData.data.sslScanData.domain.domain}" has completed.`,
        status: 'info',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
  })
  const { data: _httpsData } = useSubscription(HTTPS_SCAN_DATA, {
    skip: !isLoggedIn(),
    onSubscriptionData: ({ subscriptionData, client }) => {
      client.cache.writeQuery({
        query: GET_ONE_TIME_SCANS,
        data: { getOneTimeScans: subscriptionData.data.httpsScanData },
      })
      toast({
        title: t`HTTPS Scan Complete`,
        description: t`HTTPS scan for domain "${subscriptionData.data.httpsScanData.domain.domain}" has completed.`,
        status: 'info',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
  })

  return <Box {...props}>{children}</Box>
}

RequestScanNotificationHandler.propTypes = {
  children: node,
}
