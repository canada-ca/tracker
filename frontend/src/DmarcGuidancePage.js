import React from 'react'
import { useUserState } from './UserState'
import { useQuery } from '@apollo/client'
import { GET_GUIDANCE_TAGS_OF_DOMAIN } from './graphql/queries'
import { IconButton, Heading, Stack } from '@chakra-ui/core'
import { useParams, useHistory } from 'react-router-dom'
import ScanCard from './ScanCard'
import { Trans } from '@lingui/macro'

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

  if (loading) return <p>Loading</p>
  if (error) return <p>Error</p> // TODO: Handle this error

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
      <ScanCard scanType="web" scanData={webScan} />
      <ScanCard scanType="email" scanData={emailScan} />
    </Stack>
  )
}

DmarcGuidancePage.propTypes = {}
