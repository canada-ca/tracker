import React from 'react'
import { useUserState } from './UserState'
import { useQuery } from '@apollo/react-hooks'
import { GET_GUIDANCE_TAGS_OF_DOMAIN } from './graphql/queries'
import { Button, Heading, Icon, Stack } from '@chakra-ui/core'
import { useParams, useHistory } from 'react-router-dom'
import ScanCard from './ScanCard'
import { Trans } from '@lingui/macro'

export function DmarcGuidancePage() {
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
  })

  if (loading) return <p>Loading</p>
  if (error) return <p>Error</p> // TODO: Handle this error

  const orgName = data.findDomainBySlug.organization.name
  const webScan = data.findDomainBySlug.web.edges[0].node
  const emailScan = data.findDomainBySlug.email.edges[0].node

  return (
    <Stack spacing="25px" mb="25px">
      <Stack isInline align="center">
        <Button onClick={history.goBack}>
          <Icon color="gray.900" name="arrow-left" fontSize="2xl" />
        </Button>
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
