import React from 'react'
import { Stack, SimpleGrid, useToast } from '@chakra-ui/core'
import { string } from 'prop-types'
import { ADMIN_PANEL } from './graphql/queries'
import { useQuery } from '@apollo/client'
import { useUserState } from './UserState'
import { AdminDomains } from './AdminDomains'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { LoadingMessage } from './LoadingMessage'
import { Trans } from '@lingui/macro'
import UserList from './UserList'

export default function AdminPanel({ orgSlug, permission }) {
  const { currentUser } = useUserState()
  const toast = useToast()

  const { loading, error, data } = useQuery(ADMIN_PANEL, {
    variables: { orgSlug: orgSlug },
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
    onError: (error) => {
      const [_, message] = error.message.split(': ')
      toast({
        title: 'Error',
        description: message,
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
  })

  if (loading) {
    return (
      <LoadingMessage>
        <Trans>Organization Info</Trans>
      </LoadingMessage>
    )
  }
  // Current api returns an error if no domains found
  // TODO: Remove includes check when api is ready
  if (error && !error.includes('Error, unable to find domains')) {
    return <ErrorFallbackMessage error={error} />
  }

  return (
    <Stack spacing={10}>
      <SimpleGrid columns={{ lg: 2 }} spacing="60px" width="100%">
        <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
          <AdminDomains
            domainsData={data.findOrganizationBySlug.domains}
            orgId={data.findOrganizationBySlug.id}
            orgSlug={orgSlug}
          />
        </ErrorBoundary>
        <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
          <UserList
            permission={permission}
            userListData={data.userList}
            // orgName={orgName}
            orgSlug={orgSlug}
          />
        </ErrorBoundary>
      </SimpleGrid>
    </Stack>
  )
}

AdminPanel.propTypes = {
  orgSlug: string.isRequired,
  permission: string.isRequired,
}
