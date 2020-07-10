import React from 'react'
import { useUserState } from './UserState'
import { useQuery } from '@apollo/react-hooks'
import { FIND_DOMAIN_BY_SLUG } from './graphql/queries'
import { Stack } from '@chakra-ui/core'
import { useParams } from 'react-router-dom'
import ScanCard from './ScanCard'

export function DmarcGuidancePage() {
  const { currentUser } = useUserState()

  const { domainSlug } = useParams()

  const { loading, error, data } = useQuery(FIND_DOMAIN_BY_SLUG, {
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

  const webScan = data.findDomainBySlug.web.edges[0].node
  const emailScan = data.findDomainBySlug.email.edges[0].node

  return (
    <Stack spacing="25px" mb="25px">
      <ScanCard scanType="web" scanData={webScan} />
      <ScanCard scanType="email" scanData={emailScan} />
    </Stack>
  )
}

DmarcGuidancePage.propTypes = {}
