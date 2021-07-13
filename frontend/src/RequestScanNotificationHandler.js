import React from 'react'
import { useSubscription } from '@apollo/client'
import {
  DKIM_SCAN_DATA,
  DMARC_SCAN_DATA,
  HTTPS_SCAN_DATA,
  SPF_SCAN_DATA,
  SSL_SCAN_DATA,
} from './graphql/subscriptions'
import { Box, Heading, useToast } from '@chakra-ui/core'
import { useUserVar } from './UserState'
import { t } from '@lingui/macro'
import {
  GET_ONE_TIME_DKIM_SCANS,
  GET_ONE_TIME_DMARC_SCANS,
  GET_ONE_TIME_HTTPS_SCANS,
  GET_ONE_TIME_SCANS,
  GET_ONE_TIME_SPF_SCANS,
  GET_ONE_TIME_SSL_SCANS,
} from './graphql/queries'
import { node } from 'prop-types'

export default function RequestScanNotificationHandler({ children, ...props }) {
  const { isLoggedIn } = useUserVar()

  const toast = useToast()

  const { data: _dkimData } = useSubscription(DKIM_SCAN_DATA, {
    skip: !isLoggedIn(),
    onSubscriptionData: ({ subscriptionData, client }) => {
      client.cache.writeQuery({
        query: GET_ONE_TIME_DKIM_SCANS,
        data: { getOneTimeDkimScans: subscriptionData.data.dkimScanData },
      })
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
        query: GET_ONE_TIME_DMARC_SCANS,
        data: { getOneTimeDmarcScans: subscriptionData.data.dmarcScanData },
      })
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
        query: GET_ONE_TIME_SPF_SCANS,
        data: { getOneTimeSpfScans: subscriptionData.data.spfScanData },
      })
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
        query: GET_ONE_TIME_SSL_SCANS,
        data: { getOneTimeSslScans: subscriptionData.data.sslScanData },
      })
      client.cache.writeQuery({
        query: GET_ONE_TIME_SCANS,
        data: { getOneTimeScans: subscriptionData.data.sslScanData },
      })
      toast({
        title: t`SSL Scan Complete`,
        description: t`SSL scan for domain "${subscriptionData.data.sslScanData.domain.domain}" has completed.`,
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
        query: GET_ONE_TIME_HTTPS_SCANS,
        data: { getOneTimeHttpsScans: subscriptionData.data.httpsScanData },
      })
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
