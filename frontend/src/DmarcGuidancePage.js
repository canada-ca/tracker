import React from 'react'
import { useUserState } from './UserState'
import { useQuery } from '@apollo/client'
import { GET_GUIDANCE_TAGS_OF_DOMAIN } from './graphql/queries'
import { Heading, Stack, Divider, Icon, Link } from '@chakra-ui/core'
import { useParams, Link as RouteLink } from 'react-router-dom'
import ScanCard from './ScanCard'
import { Trans } from '@lingui/macro'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { ErrorBoundary } from 'react-error-boundary'
import { LoadingMessage } from './LoadingMessage'

export default function DmarcGuidancePage() {
  const { currentUser } = useUserState()
  const { domainSlug } = useParams()

  const { loading, error, data } = useQuery(GET_GUIDANCE_TAGS_OF_DOMAIN, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
    variables: {
      domain: domainSlug,
    },
    onComplete: (stuff) => console.log(`completed! recieved: ${stuff}`),
    onError: (e) => console.log(`error! recieved: ${e}`),
  })

  if (loading)
    return (
      <LoadingMessage>
        <Trans>Guidance Tags</Trans>
      </LoadingMessage>
    )
  if (error) return <ErrorFallbackMessage error={error} />

  const domainName = data.findDomainByDomain.domain
  const webScan = data.findDomainByDomain.web
  const emailScan = data.findDomainByDomain.email

  return (
    <Stack spacing="25px" mb="6" px="4" mx="auto" overflow="hidden">
      <Stack isInline>
        <Heading>{domainName.toUpperCase()}</Heading>
        <Link
          ml="auto"
          color="teal.500"
          whiteSpace="noWrap"
          my="auto"
          to={`/domains/${domainSlug}/dmarc-report/LAST30DAYS/${new Date().getFullYear()}`}
          as={RouteLink}
        >
          <Trans>DMARC Report</Trans>
          <Icon name="link" ml="4px" />
        </Link>
      </Stack>
      <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
        <ScanCard scanType="web" scanData={webScan} />
      </ErrorBoundary>
      <Divider />
      <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
        <ScanCard scanType="email" scanData={emailScan} />
      </ErrorBoundary>
      <Divider />
    </Stack>
  )
}
