import React from 'react'
import { useUserState } from './UserState'
import { useQuery } from '@apollo/client'
import { GET_GUIDANCE_TAGS_OF_DOMAIN } from './graphql/queries'
import { IconButton, Heading, Stack } from '@chakra-ui/core'
import { useParams, useHistory } from 'react-router-dom'
import ScanCard from './ScanCard'
import { Trans } from '@lingui/macro'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { ErrorBoundary } from 'react-error-boundary'
import { LoadingMessage } from './LoadingMessage'

export default function DmarcGuidancePage() {
  const { currentUser } = useUserState()
  const { domainSlug } = useParams()
  const history = useHistory()

  const { loading, error, data } = useQuery(GET_GUIDANCE_TAGS_OF_DOMAIN, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
    variables: {
      urlSlug: domainSlug,
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
  if (error) return <ErrorFallbackMessage error={error.message} /> // TODO: Handle this error

  const orgName = data.findDomainBySlug.organization.name
  const webScan = data.findDomainBySlug.web.edges[0].node
  const emailScan = data.findDomainBySlug.email.edges[0].node

  return (
    <Stack spacing="25px" mb="6" px="4" mx="auto" overflow="hidden">
      <Stack isInline align="center">
        <IconButton
          icon="arrow-left"
          onClick={history.goBack}
          color="gray.900"
          fontSize="2xl"
          aria-label="back to domains"
        />
        <Heading>
          <Trans>{orgName}</Trans>
        </Heading>
      </Stack>
      <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
        <ScanCard scanType="web" scanData={webScan} />
      </ErrorBoundary>
      <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
        <ScanCard scanType="email" scanData={emailScan} />
      </ErrorBoundary>
    </Stack>
  )
}

DmarcGuidancePage.propTypes = {}
