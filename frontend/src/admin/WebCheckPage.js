import React from 'react'
import { useQuery } from '@apollo/client'
import { WEBCHECK_ORGS } from '../graphql/queries'

import { Box, Divider, Heading, Text } from '@chakra-ui/react'
import { Trans } from '@lingui/macro'
import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'

export default function WebCheckPage() {
  const { loading, error, data } = useQuery(WEBCHECK_ORGS, {
    variables: { first: 100 },
  })
  if (loading) return <LoadingMessage />
  if (error) return <ErrorFallbackMessage error={error} />

  return (
    <Box>
      <Heading>
        <Trans>Web Check</Trans>
      </Heading>
      <Text fontSize="xl" fontWeight="bold">
        <Trans>Vulnerability Scan Dahsboard</Trans>
      </Text>
      <Divider borderBottomColor="gray.900" mb="8" />
      <Text>{JSON.stringify(data)}</Text>
    </Box>
  )
}
